# Task 005: Equipment Check-In Recording

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 001, Task 003, Task 004, Task 007 (approval authority), Phase 2 (Decision Log pattern)  
**Implementation**: `backend/equipments/services.py`, `backend/equipments/views.py` (implemented alongside Task 004)

## Purpose

Enable recording of check-in movements that return custody of Equipment from an external handler back to organizational control. Check-in closes the custody transfer cycle, restores availability, and completes the audit trail.

Check-in applies the same decision logging discipline as check-out (Task 004), though with relaxed authorization requirements per Task 007. The return of custody must still be documented with:
- Handler identification (who returned it)
- Timestamp of return
- Immutable record for audit purposes

Check-in without proper recording leaves custody history incomplete and compromises audit integrity.

## Inputs

- Equipment Movement entity definition from Task 003
- Approval authority rules from Task 007 (standard approval for check-in)
- Decision Log immutability pattern from Phase 2
- Valid Equipment identifier with current status "checked_out"
- Handler details: name, organizational affiliation, contact information (may differ from check-out handler)
- Recorder identity (person documenting the return)
- Optional: notes on condition or circumstances of return
- Optional: reference to triggering context

## Expected Outputs

- Check-in Movement record created with all required fields
- Movement Decision Log capturing:
  - Recorder identity
  - Timestamp of check-in
  - Any notes on return circumstances
- Equipment status automatically updated to "available"
- Complete custody cycle visible in movement history (check-out paired with check-in)
- Confirmation of successful check-in with movement identifier

## Completion Criteria

- [x] Check-in follows Task 007 authorization rules (standard approval, no PM elevation required) - `MovementAuthorizationService` with `MovementType.CHECK_IN`
- [x] Check-in can only occur when Equipment status is "checked_out" - validation in `EquipmentService.check_in()`
- [x] Check-in fails if Equipment status is "available" (nothing to return) - `ValidationError` raised
- [x] Check-in fails if handler identification is incomplete - `validate_handler_identification()`
- [x] Recorder identity is captured in Movement Decision Log - `approver`, `approver_role` fields
- [x] Equipment status changes to "available" upon successful recording - model `save()` hook
- [x] Check-in movement record is immutable after creation (Phase 2 pattern) - `EquipmentTransaction.save()` prevents updates
- [x] Check-in creates a complete check-out/check-in pair in custody history - same model for both transaction types
- [x] Check-in timestamp is automatically captured - `transaction_date` with `auto_now_add=True`
