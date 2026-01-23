# Task 001: Equipment Entity Definition

**Phase**: 4 - Equipment Movement  
**Status**: Pending

## Purpose

Define the Equipment entity as a contract-subordinate record representing a discrete, identifiable physical asset. Equipment exists to establish custody accountability, not inventory valuation.

## Inputs

- Contract entity from Phase 1 (mandatory association target)
- Equipment category classification from spec/glossary.md
- Equipment status states from spec/glossary.md

## Expected Outputs

- Equipment entity definition with:
  - Unique identifier
  - Name (human-readable designation)
  - Serial number (unique physical identifier)
  - Category (server, network, storage, security, PC, other)
  - Current custodial status
  - Mandatory reference to governing Contract
  - Optional notes field
  - Creation timestamp
  - Soft-delete marker (retired flag)

## Completion Criteria

- [ ] Equipment cannot exist without a valid Contract reference
- [ ] Equipment serial number is unique within the system
- [ ] Equipment status is one of: available, checked_out, maintenance, retired
- [ ] Equipment records cannot be hard-deleted; only retired status is permitted
- [ ] Equipment entity definition is documented and reviewable
