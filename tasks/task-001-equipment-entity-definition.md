# Task 001: Equipment Entity Definition

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Implementation**: `backend/equipments/models.py` (Equipment model)

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

- [x] Equipment cannot exist without a valid Contract reference
- [x] Equipment serial number is unique within the system
- [x] Equipment status is one of: available, checked_out, maintenance, retired
- [x] Equipment records cannot be hard-deleted; only retired status is permitted
- [x] Equipment entity definition is documented and reviewable
