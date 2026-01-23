# Scope

## Equipment Movement Tracking

Equipment Movement Tracking is an in-scope capability of CSTOM.

### Purpose

This capability exists to:

1. **Establish Custody Accountability**: Record who accepted responsibility for equipment at any point in time, enabling post-hoc determination of custody during incidents or disputes.

2. **Preserve Decision Rationale**: Capture the justification for each movement at the moment of decision, before memory fades or circumstances change.

3. **Link Movements to Operational Context**: Connect equipment movements to the Contracts, Incidents, Changes, or Tasks that necessitated them, enabling reconstruction of operational history.

4. **Support Audit and Compliance**: Provide an immutable trail of custody transfers for regulatory review, contractual dispute resolution, or internal governance.

### What Is Tracked

- Identity and classification of equipment items
- Custodial status of each equipment item
- Each transfer of custody (inbound and outbound)
- Handler identity, affiliation, and contact information for each movement
- Stated purpose and expected timeline for each movement
- Approval rationale and approver identity
- Linkage to governing Contract
- Linkage to triggering operational context (where applicable)

### Boundary Clarification

Equipment Movement Tracking is a **decision traceability** capability, not an inventory management system. The goal is to answer accountability questions ("Who had it? Why did it move? Who approved?"), not logistical questions ("Where is it stored? How many do we have?").

Equipment records exist as subordinate entities to Contracts. An equipment item without a Contract association has no meaning in CSTOM.
