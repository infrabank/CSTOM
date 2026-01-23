# Task 010: Contract Equipment Movements Query

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003, Phase 1 (Contract)

## Purpose

Enable querying all Equipment and their Movements associated with a specific Contract. This capability answers "What equipment activity has occurred under this contract?" for contract-level reporting and audit.

## Inputs

- Contract identifier
- Optional: date range filter
- Optional: equipment status filter (available, checked_out, all)
- Optional: include retired equipment flag

## Expected Outputs

- List of all Equipment records associated with the Contract
- For each Equipment:
  - Current custodial status
  - Category
  - Count of total movements
  - Most recent movement summary
- Aggregated movement statistics for the Contract:
  - Total equipment count
  - Currently checked-out count
  - Total movements in period
- Detailed movement list (if requested)

## Completion Criteria

- [ ] Query returns all Equipment linked to a given Contract
- [ ] Equipment list includes current status for each item
- [ ] Movement counts are accurate per equipment item
- [ ] Query can filter by date range
- [ ] Query can filter by current equipment status
- [ ] Retired equipment can be included or excluded by flag
- [ ] Contract-level aggregates are calculable from results
- [ ] Query supports Phase 5 reporting requirements
