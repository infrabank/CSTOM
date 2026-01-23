# Task 007: PM Approval Constraint for Operational Equipment

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 004, Phase 1 (Contract status)

## Purpose

Enforce that Equipment assigned to Contracts in operational status requires PM-level approval for outbound movements. This constraint ensures custody transfers affecting service delivery are authorized by accountable parties.

## Inputs

- Equipment record with Contract reference
- Contract status from Phase 1 (specifically: operational statuses such as stabilization, steady-state)
- User role information (PM vs. other roles)
- Check-out request

## Expected Outputs

- Check-out requests for equipment on operational contracts require PM role
- Non-PM users cannot approve check-out for operational equipment
- Check-out for equipment on non-operational contracts (pre-handover, closed) follows standard approval
- Approval role is captured in the Movement Decision Log

## Completion Criteria

- [ ] System identifies when Equipment belongs to an operationally-active Contract
- [ ] Check-out of operational equipment requires PM role verification
- [ ] Check-out fails with clear indication if non-PM attempts operational equipment approval
- [ ] Approver role is recorded in the movement record
- [ ] Equipment on closed or pre-handover contracts does not require PM approval
- [ ] Constraint applies only to check-out, not check-in
