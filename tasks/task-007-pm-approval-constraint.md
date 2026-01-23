# Task 007: PM Approval Constraint for Operational Equipment

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003, Phase 1 (Contract status), Phase 2 (Decision Log pattern)

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

- [ ] "Operational contract" status is explicitly defined (stabilization, steady-state)
- [ ] PM approval requirement for operational equipment check-out is documented
- [ ] Standard approval path for non-operational equipment is documented
- [ ] Approver role recording requirement is specified
- [ ] Authorization failure conditions are enumerated
- [ ] This task provides the authorization rules that Tasks 004 and 005 must implement
- [ ] Decision Log pattern from Phase 2 is referenced for rationale immutability
