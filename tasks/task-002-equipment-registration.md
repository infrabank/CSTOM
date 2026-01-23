# Task 002: Equipment Registration

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 001  
**Implementation**: `backend/equipments/views.py` (EquipmentViewSet.create), `backend/equipments/services.py` (EquipmentService.create)

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

- [x] Equipment can be registered with all required fields
- [x] Registration fails if Contract reference is invalid or missing
- [x] Registration fails if serial number already exists
- [x] Newly registered Equipment has status "available"
- [x] Registration timestamp is automatically captured
