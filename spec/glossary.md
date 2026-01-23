# Glossary

## Equipment

A discrete, identifiable physical asset assigned to a Contract for the purpose of fulfilling maintenance or operational obligations. Equipment is tracked not for inventory valuation, but to establish custody, responsibility, and decision history.

An Equipment record captures:
- Unique identification (name, serial number)
- Category classification
- Current custodial status
- Linkage to the governing Contract

Equipment exists in CSTOM solely to answer: "Who had custody of what, under which contract, and why did it move?"

## Equipment Movement

A recorded transfer of custody for a piece of Equipment, either outbound (check-out) or inbound (check-in). Each movement represents a decision point requiring documented rationale.

An Equipment Movement captures:
- Direction of transfer (check-out or check-in)
- Identity and affiliation of the handler accepting or returning custody
- Stated purpose or reason for the movement
- Linkage to a triggering context (Incident, Change Request, routine maintenance, etc.)
- Timestamp of the decision

Equipment Movement is not a logistics transaction. It is an auditable record of custody transfer decisions.

## Equipment Status

The current custodial state of an Equipment item. Status reflects accountability, not physical location or condition.

Defined states:
- **Available**: Equipment is under organizational custody and may be assigned
- **Checked Out**: Equipment custody has been transferred to an external handler; an active Movement record exists
- **Maintenance**: Equipment is temporarily unavailable due to scheduled servicing or inspection
- **Retired**: Equipment is no longer subject to movement; historical records are preserved

Status transitions require corresponding Movement records or authorized administrative actions.

## Movement Decision Log

The immutable record of approval rationale captured at the time of an Equipment Movement. This log answers "Why was this movement authorized?" and "Who approved it?"

A Movement Decision Log captures:
- Approver identity and role
- Approval rationale (free-text justification)
- Reference to related operational context (Incident ID, Change ID, Task ID, or equivalent)
- Timestamp of approval

Movement Decision Logs cannot be modified or deleted after creation. They exist to support audit, dispute resolution, and responsibility reconstruction.
