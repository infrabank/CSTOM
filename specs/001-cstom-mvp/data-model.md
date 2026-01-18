# Data Model: CSTOM MVP Core

**Date**: 2026-01-18

## Core Entities

### Contract

**Purpose**: Root entity for all records in a business engagement.

**Key Fields**:
- name
- client_org
- start_date
- end_date
- contract_amount
- scope_flags (ops/build/transition/pm)
- status (pre-handover, handover, stabilization, steady, closed)
- risk_flags (pre_env, prior_vendor_coordination, docs_incomplete)
- created_at
- updated_at

**Relationships**:
- Contract has many Tasks
- Contract has many ChangeIncidents
- Contract has many Reports

### Task

**Purpose**: Unit of work tied to a Contract with auditability and decision trace.

**Key Fields**:
- contract_id
- task_type (routine/incident/change/request)
- impact_level (none/partial/full)
- approval_required (boolean)
- title
- description
- created_at
- updated_at

**Relationships**:
- Task has many DecisionLogs

### DecisionLog

**Purpose**: Immutable record of why a decision was made for a Task.

**Key Fields**:
- task_id
- actor_role (pm/engineer/joint)
- rationale_checklist (structured flags)
- rationale_notes
- alternatives_considered (yes/no)
- risk_acknowledged (yes/no)
- created_at

**Relationships**:
- DecisionLog belongs to Task

### ChangeIncident

**Purpose**: Unified record for changes and incidents.

**Key Fields**:
- contract_id
- record_type (change/incident)
- occurred_at
- detected_at
- resolved_at
- customer_notified (boolean)
- customer_notified_at
- related_change_id (self-reference)
- summary_notice
- audit_summary
- created_at

**Relationships**:
- ChangeIncident belongs to Contract
- ChangeIncident may reference another ChangeIncident

### Report

**Purpose**: Generated output for monthly, incident, and audit reporting.

**Key Fields**:
- contract_id
- report_type (monthly/incident/audit)
- period_start
- period_end
- generated_at
- summary
- integrity_hash

**Relationships**:
- Report belongs to Contract

### Role

**Purpose**: Role definitions for RBAC.

**Key Fields**:
- name (pm/engineer/admin/customer)
- description
- created_at

### User

**Purpose**: System user with assigned role(s).

**Key Fields**:
- display_name
- email
- role_ids
- status (active/inactive)
- created_at
- updated_at

### AuditEvent

**Purpose**: Append-only audit trail for all critical actions.

**Key Fields**:
- actor_id
- actor_role
- action_type
- entity_type
- entity_id
- occurred_at
- request_id
- ip_address
- user_agent
- before_snapshot (optional)
- after_snapshot (optional)

## Validation Rules

- All records must reference a Contract, except system-wide Role definitions.
- DecisionLog entries are append-only and cannot be modified or deleted.
- ChangeIncident timestamps must satisfy occurred_at <= detected_at <= resolved_at when present.
- Report integrity_hash must be set on generation.
- AuditEvent is insert-only with time-ordered indexing.

## State Transitions

- Contract status transitions are linear: pre-handover -> handover -> stabilization -> steady -> closed.
- Task approval_required is derived from impact_level and task_type per policy (defined in requirements).
