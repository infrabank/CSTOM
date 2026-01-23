# Task 005: Equipment Check-In Recording

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003, Task 004

## Purpose

Enable recording of check-in movements that return custody of Equipment from an external handler back to organizational control. Check-in closes the custody transfer cycle and restores availability.

## Inputs

- Equipment Movement entity definition from Task 003
- Valid Equipment identifier with current status "checked_out"
- Handler details: name, organizational affiliation, contact information (may differ from check-out handler)
- Optional: notes on condition or circumstances of return
- Optional: reference to triggering context

## Expected Outputs

- Check-in Movement record created with all required fields
- Equipment status automatically updated to "available"
- Timestamp of check-in captured
- Confirmation of successful check-in with movement identifier
- Complete custody cycle visible in movement history

## Completion Criteria

- [ ] Check-in can only occur when Equipment status is "checked_out"
- [ ] Check-in fails if Equipment status is "available" (nothing to return)
- [ ] Check-in fails if handler identification is incomplete
- [ ] Equipment status changes to "available" upon successful recording
- [ ] Check-in movement record is immutable after creation
- [ ] Check-in creates a complete check-out/check-in pair in history
