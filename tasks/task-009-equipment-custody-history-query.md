# Task 009: Equipment Custody History Query

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 003, Task 004, Task 005

## Purpose

Enable querying the complete custody history for any Equipment item. This capability answers "Who has had custody of this equipment and when?" for audit, dispute resolution, and accountability purposes.

## Inputs

- Equipment identifier
- Optional: date range filter
- Optional: transaction type filter (check-out only, check-in only, or all)

## Expected Outputs

- Chronologically ordered list of all Movement records for the specified Equipment
- Each record includes:
  - Transaction type (check-out or check-in)
  - Handler identity and affiliation
  - Purpose statement
  - Timestamp
  - Triggering context reference (if linked)
  - Approver identity (for check-out)
- Current custodial status clearly indicated
- Periods of external custody calculable from check-out/check-in pairs

## Completion Criteria

- [ ] Query returns all movements for a given Equipment identifier
- [ ] Results are sorted by timestamp (oldest to newest or configurable)
- [ ] Query can be filtered by date range
- [ ] Query can be filtered by transaction type
- [ ] Current status is derivable from most recent movement
- [ ] Query performs acceptably for equipment with extensive history
