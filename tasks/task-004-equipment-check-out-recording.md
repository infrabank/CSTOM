# Task 004: Equipment Check-Out Recording

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 001, Task 003, Task 007 (approval authority), Phase 2 (Decision Log pattern)  
**Implementation**: `backend/equipments/services.py`, `backend/equipments/models.py`, `backend/equipments/views.py`

## Purpose

Enable recording of check-out movements that transfer custody of Equipment from organizational control to an external handler. Check-out creates an accountability record answering "Who took it and why?" with frozen approval rationale.

Check-out is the primary decision point in Equipment Movement. This task must enforce:
- The approval authority rules defined in Task 007
- The decision logging pattern established in Phase 2
- The immutability constraints that preserve audit integrity

A check-out without proper authorization or documented rationale violates CSTOM's core accountability principle.

## Inputs

- Equipment Movement entity definition from Task 003
- Approval authority rules from Task 007 (PM requirement for operational equipment)
- Decision Log immutability pattern from Phase 2
- Valid Equipment identifier with current status "available"
- Handler details: name, organizational affiliation, contact information
- Purpose statement explaining reason for custody transfer
- Approver identity and role (must satisfy Task 007 authorization rules)
- Approval rationale (immutable once recorded)
- Optional: expected return date
- Optional: reference to triggering context (Incident ID, Change ID, Task ID)

## Expected Outputs

- Check-out Movement record created with all required fields
- Movement Decision Log capturing:
  - Approver identity and role
  - Approval rationale (frozen at decision time)
  - Timestamp of approval
- Equipment status automatically updated to "checked_out"
- Authorization verification per Task 007 rules
- Confirmation of successful check-out with movement identifier

## Completion Criteria

- [x] Check-out enforces Task 007 approval rules (PM required for operational equipment) - `MovementAuthorizationService.authorize()`
- [x] Check-out fails if approver lacks required authorization level - `AuthorizationDeniedError`
- [x] Check-out can only occur when Equipment status is "available" - `EquipmentService.check_out()` validation
- [x] Check-out fails if Equipment status is "checked_out" (no concurrent check-outs) - status check in service
- [x] Check-out fails if handler identification is incomplete - `validate_handler_identification()`
- [x] Check-out fails if purpose statement is missing or empty - `validate_rationale()`
- [x] Check-out fails if approval rationale is missing - `validate_rationale()`
- [x] Approver identity and role are recorded in Movement Decision Log - `approver`, `approver_role` fields in EquipmentTransaction
- [x] Approval rationale is immutable after creation (Phase 2 pattern) - `EquipmentTransaction.save()` prevents updates
- [x] Equipment status changes to "checked_out" upon successful recording - model save() hook
- [x] Check-out movement record is immutable after creation - `EquipmentTransaction.save()` and `delete()` raise ValidationError
