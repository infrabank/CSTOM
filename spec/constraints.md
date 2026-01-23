# Constraints

## Equipment Movement Constraints

The following rules are non-negotiable for Equipment Movement tracking within CSTOM.

### Approval and Authorization

1. **No Movement Without Recorded Rationale**: Every equipment movement (check-out or check-in) must include a documented reason at the time of recording. Movements without stated purpose are not permitted.

2. **PM-Only Approval for Operational Equipment**: Equipment currently assigned to an active Contract in operational status requires PM-level approval for any outbound movement. This constraint ensures that decisions affecting service delivery are made by accountable parties.

3. **Handler Identification Required**: Every movement must record the identity, organizational affiliation, and contact information of the handler accepting or returning custody. Anonymous movements are not permitted.

### Data Integrity

4. **No Hard Deletion of Equipment Records**: Equipment records may be marked as retired but cannot be permanently removed from the system. Historical queries must be able to resolve equipment references indefinitely.

5. **No Hard Deletion of Movement Records**: Movement records are immutable audit entries. Once created, a movement record cannot be modified or deleted. Corrections must be made through new compensating records with documented explanation.

6. **No Modification of Movement Decision Logs**: Approval rationale captured at the time of movement cannot be edited after the fact. The decision log reflects the understanding at the moment of decision.

### Referential Integrity

7. **Mandatory Contract Linkage**: Every equipment item must be associated with exactly one Contract. Equipment without contract association has no operational meaning in CSTOM.

8. **Operational Context Linkage**: Movements should reference the triggering operational context (Incident, Change, Task, or equivalent) when applicable. For routine or administrative movements, a free-text justification is acceptable.

### Status Consistency

9. **Status Must Reflect Reality**: Equipment status must accurately reflect current custody state. Check-out creates "Checked Out" status; check-in restores "Available" status. Status cannot be manually overridden without a corresponding movement record.

10. **No Concurrent Check-Outs**: An equipment item in "Checked Out" status cannot be checked out again until it has been checked in. Custody is singular and unambiguous.
