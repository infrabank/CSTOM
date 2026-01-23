# Task 005: Equipment Check-In Recording

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003, Task 004, Task 007 (approval authority), Phase 2 (Decision Log pattern)

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

- [ ] Check-in follows Task 007 authorization rules (standard approval, no PM elevation required)
- [ ] Check-in can only occur when Equipment status is "checked_out"
- [ ] Check-in fails if Equipment status is "available" (nothing to return)
- [ ] Check-in fails if handler identification is incomplete
- [ ] Recorder identity is captured in Movement Decision Log
- [ ] Equipment status changes to "available" upon successful recording
- [ ] Check-in movement record is immutable after creation (Phase 2 pattern)
- [ ] Check-in creates a complete check-out/check-in pair in custody history
- [ ] Check-in timestamp is automatically captured
