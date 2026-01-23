# Task 009: Equipment Custody History Query

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 003, Task 004, Task 005, Task 007, Task 008  
**Implementation**: `backend/equipments/services.py` (CustodyHistoryService), `backend/equipments/views.py` (custody_history action)

## Purpose

Provide audit and verification capability to reconstruct the complete custody history for any Equipment item. This query answers the fundamental accountability question: "Who has had custody of this equipment, when, and under what authority?"

This is a **verification capability**, not an operational workflow. It exists to:
- Support post-incident investigation ("Who had the server when it failed?")
- Enable audit compliance ("Show me all custody transfers for equipment X")
- Resolve disputes ("Was PM approval obtained for this check-out?")
- Verify constraint enforcement ("Were all movements properly authorized?")

Query results must expose the full decision trail, including approver roles and rationale, as captured by Tasks 004, 005, and 007.

## Inputs

- Equipment identifier
- Optional: date range filter
- Optional: transaction type filter (check-out only, check-in only, or all)
- Optional: approver role filter (PM-approved only, etc.)

## Expected Outputs

- Chronologically ordered list of all Movement records for the specified Equipment
- Each record includes:
  - Transaction type (check-out or check-in)
  - Handler identity and affiliation
  - Purpose statement (for check-out)
  - Timestamp
  - Triggering context reference (if linked)
  - Approver identity and role (verifiable against Task 007 rules)
  - Approval rationale (immutable, as captured)
- Current custodial status clearly indicated
- Periods of external custody calculable from check-out/check-in pairs
- Verification indicators:
  - Whether PM approval was required (per Task 007)
  - Whether PM approval was obtained

## Completion Criteria

- [x] Query returns all movements for a given Equipment identifier
- [x] Results are sorted by timestamp (oldest to newest or configurable)
- [x] Query can be filtered by date range
- [x] Query can be filtered by transaction type
- [x] Query exposes approver role for authorization verification
- [x] Query exposes approval rationale for audit purposes
- [x] Current status is derivable from most recent movement
- [x] Query supports identification of Task 007 compliance (PM approval where required)
- [x] Query performs acceptably for equipment with extensive history
- [x] Query results are sufficient for audit and dispute resolution
