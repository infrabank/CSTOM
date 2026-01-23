# Task 003: Equipment Movement Entity Definition

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001

## Purpose

Define the Equipment Movement entity as an immutable audit record of custody transfer. Each movement captures the decision to transfer custody (check-out) or return custody (check-in).

## Inputs

- Equipment entity definition from Task 001
- Movement Decision Log structure from spec/glossary.md
- Operational context entities from Phase 3 (Incident, Change, Task)

## Expected Outputs

- Equipment Movement entity definition with:
  - Unique identifier
  - Reference to Equipment being moved
  - Transaction type (check_out or check_in)
  - Handler identity (name, affiliation, contact)
  - Purpose statement (mandatory)
  - Expected return date (for check-out, optional)
  - Actual transaction timestamp
  - Reference to triggering context (Incident ID, Change ID, Task ID, or free-text)
  - Approval rationale (immutable after creation)
  - Approver identity and role

## Completion Criteria

- [ ] Movement entity captures both check-out and check-in transaction types
- [ ] Movement requires reference to a valid Equipment record
- [ ] Handler identification fields are mandatory (name, affiliation, contact)
- [ ] Purpose field is mandatory and cannot be empty
- [ ] Movement records cannot be modified after creation
- [ ] Movement records cannot be deleted (immutable audit trail)
