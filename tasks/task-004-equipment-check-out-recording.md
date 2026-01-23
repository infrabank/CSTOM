# Task 004: Equipment Check-Out Recording

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003

## Purpose

Enable recording of check-out movements that transfer custody of Equipment from organizational control to an external handler. Check-out creates an accountability record answering "Who took it and why?"

## Inputs

- Equipment Movement entity definition from Task 003
- Valid Equipment identifier with current status "available"
- Handler details: name, organizational affiliation, contact information
- Purpose statement explaining reason for custody transfer
- Optional: expected return date
- Optional: reference to triggering context (Incident ID, Change ID, Task ID)
- Approval rationale from authorizing party

## Expected Outputs

- Check-out Movement record created with all required fields
- Equipment status automatically updated to "checked_out"
- Timestamp of check-out captured
- Immutable approval rationale recorded
- Confirmation of successful check-out with movement identifier

## Completion Criteria

- [ ] Check-out can only occur when Equipment status is "available"
- [ ] Check-out fails if Equipment status is "checked_out" (no concurrent check-outs)
- [ ] Check-out fails if handler identification is incomplete
- [ ] Check-out fails if purpose statement is missing or empty
- [ ] Equipment status changes to "checked_out" upon successful recording
- [ ] Check-out movement record is immutable after creation
