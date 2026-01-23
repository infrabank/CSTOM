# Task 006: Operational Context Linkage

**Phase**: 4 - Equipment Movement  
**Status**: Pending  
**Depends On**: Task 003, Phase 3 (Operational Events)

## Purpose

Enable linking Equipment Movements to their triggering operational context. Movements often occur in response to Incidents, Changes, or Tasks. This linkage answers "Why did this equipment move at this time?"

## Inputs

- Equipment Movement entity from Task 003
- Incident entity from Phase 3
- Change entity from Phase 3
- Task entity from Phase 2
- Movement record requiring context linkage

## Expected Outputs

- Movement records can reference one of:
  - Incident identifier
  - Change identifier
  - Task identifier
  - Free-text justification (when no formal context exists)
- Context reference is captured at time of movement creation
- Context reference is immutable after creation
- Ability to query movements by associated context

## Completion Criteria

- [ ] Movement can be linked to an Incident by identifier
- [ ] Movement can be linked to a Change by identifier
- [ ] Movement can be linked to a Task by identifier
- [ ] Movement can have free-text context when no formal reference applies
- [ ] Context linkage is optional but recommended
- [ ] Linked context identifiers are validated against existing records
- [ ] Context linkage cannot be modified after movement creation
