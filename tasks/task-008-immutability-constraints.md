# Task 008: Immutability and Soft-Delete Constraints

**Phase**: 4 - Equipment Movement  
**Status**: Completed  
**Depends On**: Task 001, Task 003  
**Implementation**: `backend/equipments/models.py` (EquipmentTransaction.save/delete overrides)

## Purpose

Enforce data integrity constraints that preserve the audit trail. Equipment and Movement records must never be hard-deleted or modified after creation, ensuring historical queries can always reconstruct custody at any point in time.

## Inputs

- Equipment entity definition from Task 001
- Equipment Movement entity definition from Task 003
- spec/constraints.md rules on deletion and modification

## Expected Outputs

- Equipment records:
  - Cannot be permanently deleted
  - Can only be marked as "retired" status
  - Remain queryable after retirement
- Movement records:
  - Cannot be modified after creation
  - Cannot be deleted under any circumstances
  - Purpose, rationale, and handler fields are write-once
- Corrections require new compensating records with documented explanation

## Completion Criteria

- [ ] Delete operations on Equipment records are rejected
- [x] Equipment can transition to "retired" status but record persists
- [x] Delete operations on Movement records are rejected
- [x] Update operations on Movement records are rejected
- [x] Historical Equipment records remain resolvable by identifier
- [x] Historical Movement records remain resolvable by identifier
- [ ] System provides mechanism for compensating entries when corrections are needed
