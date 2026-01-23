# CSTOM MVP Implementation Plan

**Project**: CSTOM (Contract-centric Project Control System)  
**Purpose**: Freeze PM decisions, responsibility, and risk history for IT maintenance contracts  
**Branch**: `001-cstom-mvp`

---

## Phase Overview

| Phase | Name | Dependencies | Primary Outcome |
|-------|------|--------------|-----------------|
| 1 | Contract Foundation | None | Contract-centric data ownership established |
| 2 | Decision Traceability | Phase 1 | Judgment rationale frozen at point of decision |
| 3 | Operational Events | Phases 1, 2 | Change and Incident history with linkage |
| 4 | Equipment Movement | Phases 1, 2, 3 | Custody accountability and movement rationale |
| 5 | Reporting | Phases 1-4 | Audit-ready document generation |
| 6 | Access Control | All prior phases | Role-based responsibility boundaries |

---

## Phase 1: Contract Foundation

### Purpose

Establish the Contract as the central organizing unit for all CSTOM data. Every subsequent capability depends on Contract existence. This phase creates the anchor point for responsibility attribution.

### Why First

CSTOM is contract-centric by design. Without a Contract:
- Tasks have no organizational home
- Decisions have no accountability context
- Equipment has no custodial authority
- Reports have no scope boundary

Contract must exist before any dependent entity can be meaningful.

### Capabilities After This Phase

- Create and retrieve Contract records with basic information (name, client, period, amount)
- Record scope classification (operation, construction, transition, PM involvement)
- Capture risk flags (pre-environment handover, prior vendor coordination, documentation completeness)
- Track Contract lifecycle status (pre-handover, handover, stabilization, steady-state, closed)
- Query all Contracts and filter by status or client

### What This Phase Does NOT Include

- Task recording (Phase 2)
- Decision logging (Phase 2)
- Change or Incident tracking (Phase 3)
- Equipment assignment (Phase 4)
- Report generation (Phase 5)

---

## Phase 2: Decision Traceability

### Purpose

Enable recording of Tasks and their associated Decision Logs. This phase implements CSTOM's core differentiator: freezing the rationale behind operational decisions at the moment they are made.

### Why After Phase 1

Tasks are subordinate to Contracts. A Task without Contract association violates the contract-centric model. Decision Logs reference Tasks, creating a dependency chain:

```
Contract → Task → DecisionLog
```

### Capabilities After This Phase

- Create Tasks linked to a specific Contract
- Classify Tasks by type (routine, incident, change, request)
- Record impact level and approval requirements
- Capture Decision Logs with:
  - Decision-maker identity and role
  - Rationale justification
  - Alternatives considered
  - Risk acknowledgment
- Query decision history for any Task
- Prevent modification of Decision Logs after creation

### What This Phase Does NOT Include

- Formal Change/Incident event structure (Phase 3)
- Equipment custody decisions (Phase 4)
- Aggregated reporting of decisions (Phase 5)

---

## Phase 3: Operational Events

### Purpose

Implement unified tracking of Changes and Incidents with timeline precision and mutual linkage. This phase addresses the most frequent source of contractual disputes: establishing what happened, when, and whether related events were connected.

### Why After Phase 2

Changes and Incidents generate Tasks and require Decision Logs. The judgment infrastructure from Phase 2 must exist to capture the rationale behind incident response or change execution.

Additionally, the Change/Incident → Task → DecisionLog chain provides complete traceability from event occurrence to operational response to judgment rationale.

### Capabilities After This Phase

- Record Change and Incident events with unified structure
- Capture precise timestamps (occurrence, detection, response, resolution)
- Record customer notification status and timing
- Link related Changes and Incidents bidirectionally
- Generate summary text for initial announcements
- Query event timeline for any Contract
- Connect events to Tasks and Decision Logs

### What This Phase Does NOT Include

- Equipment movement triggered by events (Phase 4)
- Incident reports and change summaries (Phase 5)

---

## Phase 4: Equipment Movement

### Purpose

Enable custody accountability for physical equipment assigned to Contracts. This phase implements Equipment Movement Tracking as defined in the specification: recording who had custody of what, under which contract, and why it moved.

### Why After Phase 3

Equipment Movement depends on all prior foundations:

1. **Contract (Phase 1)**: Equipment must be assigned to exactly one Contract. Equipment without contract association has no meaning in CSTOM.

2. **Decision Log (Phase 2)**: Every movement requires documented rationale. The Movement Decision Log follows the same immutability principles as Task Decision Logs.

3. **Operational Events (Phase 3)**: Movements often occur in response to Incidents or Changes. The operational context linkage (Incident ID, Change ID, Task ID) requires these entities to exist.

Equipment Movement cannot be implemented earlier because:
- Without Contracts, there is no custodial authority
- Without Decision Logs, there is no rationale capture mechanism
- Without Operational Events, movement triggers cannot be referenced

### Capabilities After This Phase

- Register Equipment items linked to Contracts
- Classify Equipment by category
- Track Equipment custodial status (available, checked out, maintenance, retired)
- Record Equipment Movements (check-out and check-in) with:
  - Handler identity, affiliation, and contact
  - Stated purpose
  - Expected return timeline (for check-out)
  - Approval rationale
  - Reference to triggering context (Incident, Change, Task, or free-text)
- Enforce movement constraints:
  - No movement without recorded rationale
  - PM approval required for operational equipment
  - No concurrent check-outs
  - No hard deletion of equipment or movement records
- Query custody history for any Equipment item
- Query all Equipment movements for a Contract

### What This Phase Does NOT Include

- Equipment depreciation, valuation, or financial tracking
- Warehouse management or physical location tracking
- Barcode/RFID integration
- Preventive maintenance scheduling
- Utilization analytics
- Cross-contract equipment sharing

### Constraint Enforcement

This phase must implement the following non-negotiable constraints from the specification:

| Constraint | Enforcement |
|------------|-------------|
| No Movement Without Rationale | Movement creation requires purpose field |
| PM Approval for Operational Equipment | Check-out of equipment on active contracts requires PM role |
| Handler Identification Required | Movement requires handler name, affiliation, contact |
| No Hard Deletion | Equipment and Movement records support only soft delete |
| Immutable Decision Logs | Movement rationale cannot be modified after creation |
| Mandatory Contract Linkage | Equipment creation requires valid Contract reference |
| Status Consistency | Check-out sets "Checked Out"; check-in sets "Available" |
| No Concurrent Check-Outs | Check-out blocked if current status is "Checked Out" |

---

## Phase 5: Reporting

### Purpose

Generate audit-ready documents that aggregate data from all prior phases. Reports demonstrate contractual compliance and support dispute resolution by citing frozen decisions and custody records.

### Why After Phase 4

Reports aggregate and cite data from all entity types:
- Contract summaries
- Task and Decision Log citations
- Change and Incident timelines
- Equipment Movement history

All source data must exist before meaningful reports can be generated.

### Capabilities After This Phase

- Generate monthly inspection reports with:
  - Contract summary
  - Task and event counts
  - Notable incidents and decisions
- Generate incident reports with:
  - Timeline reconstruction
  - Decision rationale citations
  - Equipment involvement (if applicable)
- Generate audit summary reports with:
  - Compliance evidence
  - Decision trail documentation
  - Custody transfer records
- Auto-populate report sections from source data

### What This Phase Does NOT Include

- Ad-hoc query builders
- Custom report templates
- External system export

---

## Phase 6: Access Control

### Purpose

Enforce role-based boundaries on who can create, modify, and view records. This phase ensures that decision responsibility and custody accountability align with organizational authority.

### Why Last

Access control is a cross-cutting concern that affects all prior capabilities. Implementing it last allows:
- All entities to be defined before permission rules are applied
- Role-based rules to reference the complete data model
- Testing of functional correctness before adding authorization complexity

### Capabilities After This Phase

- Define roles: PM, Engineer, Administrator, Customer (read-only)
- Restrict Decision Log modification to PM role
- Restrict Equipment Movement approval to PM for operational equipment
- Enforce read-only access for Customer role
- Prevent record deletion across all roles
- Audit access attempts and violations

---

## Phase Dependencies Summary

```
Phase 1: Contract Foundation
    │
    ▼
Phase 2: Decision Traceability
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3: Operational   Phase 4: Equipment Movement
Events                 (requires Phase 3 for context linkage)
    │                  │
    └────────┬─────────┘
             ▼
      Phase 5: Reporting
             │
             ▼
      Phase 6: Access Control
```

---

## Equipment Movement Positioning Rationale

Equipment Movement is positioned in Phase 4 because:

1. **Conceptual Dependency**: Equipment belongs to Contracts (Phase 1 required)

2. **Decision Pattern Reuse**: Movement Decision Logs mirror Task Decision Logs in structure and immutability (Phase 2 pattern required)

3. **Operational Context**: Movements reference Incidents, Changes, or Tasks as triggers (Phase 3 required for complete linkage)

4. **Audit Trail Completeness**: Equipment custody questions arise during incident investigation and audit. Having operational events established ensures movements can be contextualized.

5. **Constraint Enforcement**: The PM-approval constraint for operational equipment requires understanding of Contract status and role-based decision authority, which builds on Phase 2 foundations.

Equipment Movement cannot be earlier because its core value proposition—answering "Who had custody and why?"—requires the decision-making infrastructure to exist first.

Equipment Movement should not be later because:
- Reports (Phase 5) may need to cite equipment involvement
- Access Control (Phase 6) needs to enforce equipment-specific permissions
