# Task 010: Contract Equipment Movements Query

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001, Task 003, Task 004, Task 005, Task 007, Phase 1 (Contract)

## Purpose

Provide contract-level audit and verification capability to review all Equipment activity under a specific Contract. This query answers: "What equipment custody activity has occurred under this contract, and was it properly authorized?"

This is a **verification and reporting capability** that aggregates movement data for:
- Contract-level compliance review ("Show all equipment movements for Contract X")
- Periodic audit preparation ("Generate equipment activity summary for Q3")
- Phase 5 reporting inputs (monthly reports, audit summaries)
- Authorization compliance verification ("Were all operational equipment check-outs PM-approved?")

Query results must support verification of Task 007 compliance across all equipment associated with the Contract.

## Inputs

- Contract identifier
- Optional: date range filter
- Optional: equipment status filter (available, checked_out, all)
- Optional: include retired equipment flag
- Optional: authorization compliance filter (PM-approved only, standard approval, all)

## Expected Outputs

- List of all Equipment records associated with the Contract
- For each Equipment:
  - Current custodial status
  - Category
  - Count of total movements
  - Most recent movement summary (including approver role)
- Aggregated movement statistics for the Contract:
  - Total equipment count
  - Currently checked-out count
  - Total movements in period
  - PM-approved movements count
  - Standard-approved movements count
- Authorization compliance summary:
  - Movements requiring PM approval (per Task 007)
  - Movements that received PM approval
  - Compliance rate
- Detailed movement list (if requested)

## Completion Criteria

- [ ] Query returns all Equipment linked to a given Contract
- [ ] Equipment list includes current status for each item
- [ ] Movement counts are accurate per equipment item
- [ ] Query can filter by date range
- [ ] Query can filter by current equipment status
- [ ] Retired equipment can be included or excluded by flag
- [ ] Contract-level aggregates are calculable from results
- [ ] Authorization compliance metrics are included (Task 007 verification)
- [ ] Query results are sufficient for Phase 5 reporting requirements
- [ ] Query supports audit preparation and compliance review use cases
