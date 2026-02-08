# Data Model (Django Models)

## Entity Relationship

```
User (1) ──┬── (M) Role
           │
           └── (M) AuditEvent

Contract (1) ──┬── (M) Task ──── (M) DecisionLog
               │
               ├── (M) ChangeIncident
               │
               ├── (M) Report
               │
               └── (M) ContractStatusHistory
```

## Models

### users.Role
```python
name: CharField(50)          # pm | engineer | admin | customer
description: TextField
created_at: DateTimeField
```

### users.User (AbstractUser)
```python
# Inherited: username, email, password, first_name, last_name, is_staff, is_superuser
display_name: CharField(150)
roles: ManyToMany(Role)      # RBAC role assignments
status: CharField(20)        # active | inactive
created_at: DateTimeField
updated_at: DateTimeField
```

### contracts.Contract
```python
name: CharField(255)
client_org: CharField(255)
start_date: DateField
end_date: DateField
contract_amount: DecimalField(15,2)
scope_flags: CharField(100)          # CSV: ops,build,transition,pm
status: CharField(20)                # pre-handover | handover | stabilization | steady | closed
risk_pre_env: BooleanField
risk_prior_vendor: BooleanField
risk_docs_incomplete: BooleanField
created_at: DateTimeField
updated_at: DateTimeField
```

### contracts.ContractStatusHistory
```python
contract: FK(Contract)
old_status: CharField(20)
new_status: CharField(20)
notes: TextField
changed_at: DateTimeField
```

### tasks.Task
```python
contract: FK(Contract)
task_type: CharField(20)             # routine | incident | change | request
impact_level: CharField(20)          # none | partial | full
approval_required: BooleanField      # Auto-derived from impact/type
title: CharField(255)
description: TextField
created_at: DateTimeField
updated_at: DateTimeField
```

### decisions.DecisionLog (Append-only)
```python
task: FK(Task)
actor_role: CharField(20)            # pm | engineer | joint
rationale_checklist: JSONField
rationale_notes: TextField
alternatives_considered: BooleanField
risk_acknowledged: BooleanField
created_at: DateTimeField
```

### events.ChangeIncident
```python
contract: FK(Contract)
record_type: CharField(20)           # change | incident
title: CharField(255)
description: TextField
occurred_at: DateTimeField
detected_at: DateTimeField
resolved_at: DateTimeField
customer_notified: BooleanField
customer_notified_at: DateTimeField
related_event: FK(self)              # Link change <-> incident
summary_notice: TextField
audit_summary: TextField
created_at: DateTimeField
```

### audit.AuditEvent (Append-only)
```python
actor: FK(User)
actor_role: CharField(50)
action_type: CharField(50)           # create | update | delete | login | logout | role_change | permission_denied
entity_type: CharField(100)
entity_id: CharField(100)
occurred_at: DateTimeField
request_id: CharField(100)
ip_address: GenericIPAddressField
user_agent: TextField
before_snapshot: JSONField
after_snapshot: JSONField
```

### reports.Report
```python
contract: FK(Contract)
report_type: CharField(20)           # monthly | incident | audit
period_start: DateField
period_end: DateField
generated_at: DateTimeField
summary: TextField
integrity_hash: CharField(64)        # SHA-256 for audit integrity
```

## Indexes

### AuditEvent
- `(entity_type, entity_id)`
- `(actor, occurred_at)`

## Immutable Models
- **DecisionLog** - Cannot update or delete after creation
- **AuditEvent** - Cannot update or delete after creation

## Business Rules
- Task.approval_required auto-set to `true` if impact_level="full" or task_type="change"
- Report.integrity_hash auto-generated on save using SHA-256
- ContractStatusHistory auto-created when Contract.update_status() called
