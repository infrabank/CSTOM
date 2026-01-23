# Task 007: PM Approval Constraint for Operational Equipment

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 001, Task 003, Phase 1 (Contract status), Phase 2 (Decision Log pattern)  
**Implementation**: `backend/equipments/authorization.py`

## Purpose

Define the approval authority model for Equipment Movements. This task establishes WHO can authorize custody transfers and WHEN elevated approval (PM role) is required. Task 007 is the foundational authorization mechanism that Tasks 004 and 005 must enforce during movement recording.

Without this constraint definition:
- Check-out and check-in operations have no authorization framework
- Movements affecting operational contracts lack accountability
- Decision logging has no approver context to capture

This task must be conceptually complete before movement recording (Tasks 004, 005) can enforce authorization rules.

## Inputs

- Equipment entity with mandatory Contract reference from Task 001
- Movement entity structure from Task 003
- Contract lifecycle status definitions from Phase 1
- Decision Log immutability pattern from Phase 2
- Role definitions: PM, Engineer, Administrator

## Expected Outputs

- Clear definition of which Contract statuses constitute "operational" (requiring PM approval)
- Authorization rules for check-out movements:
  - Operational contracts (stabilization, steady-state): PM approval required
  - Non-operational contracts (pre-handover, closed): standard approval permitted
- Authorization rules for check-in movements:
  - Standard approval for all contract statuses (returning custody is less restrictive)
- Approver identity and role captured as part of Movement Decision Log
- Rejection criteria when authorization requirements are not met

## Completion Criteria

- [x] "Operational contract" status is explicitly defined (stabilization, steady-state) - `OPERATIONAL_CONTRACT_STATUSES`
- [x] PM approval requirement for operational equipment check-out is documented - `requires_pm_approval()`
- [x] Standard approval path for non-operational equipment is documented - `NON_OPERATIONAL_CONTRACT_STATUSES`
- [x] Approver role recording requirement is specified - `AuthorizationResult.approver_role`
- [x] Authorization failure conditions are enumerated - `AuthorizationDeniedError`, `RationaleMissingError`, `HandlerIdentificationError`
- [x] This task provides the authorization rules that Tasks 004 and 005 must implement - `MovementAuthorizationService`
- [x] Decision Log pattern from Phase 2 is referenced for rationale immutability - `MovementDecisionLog` (frozen dataclass)
