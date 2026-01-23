# Task 002: Equipment Registration

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 001

## Purpose

Enable creation of Equipment records linked to a specific Contract. Registration establishes initial custody under organizational control with "available" status.

## Inputs

- Equipment entity definition from Task 001
- Valid Contract identifier (from Phase 1)
- Equipment details: name, serial number, category
- Optional: notes

## Expected Outputs

- Ability to create new Equipment records with:
  - Validated Contract reference (must exist and be active)
  - Required fields: name, serial number, category
  - Initial status set to "available"
  - Creation timestamp recorded
- Validation that serial number does not duplicate existing records
- Confirmation of successful registration with assigned identifier

## Completion Criteria

- [ ] Equipment can be registered with all required fields
- [ ] Registration fails if Contract reference is invalid or missing
- [ ] Registration fails if serial number already exists
- [ ] Newly registered Equipment has status "available"
- [ ] Registration timestamp is automatically captured
