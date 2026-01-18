"""Summary generation for change/incident events."""

from datetime import datetime


def generate_summaries(event) -> None:
    """Generate summary_notice and audit_summary for an event."""
    event.summary_notice = generate_notice_summary(event)
    event.audit_summary = generate_audit_summary(event)
    event.save(update_fields=["summary_notice", "audit_summary"])


def generate_notice_summary(event) -> str:
    """Generate 1st notice summary for customer communication."""
    type_label = "Change" if event.record_type == "change" else "Incident"
    occurred = format_datetime(event.occurred_at)

    lines = [
        f"[{type_label}] {event.title}",
        f"Occurred: {occurred}",
    ]

    if event.detected_at:
        lines.append(f"Detected: {format_datetime(event.detected_at)}")

    if event.resolved_at:
        lines.append(f"Resolved: {format_datetime(event.resolved_at)}")
    else:
        lines.append("Status: In Progress")

    if event.description:
        lines.append(f"Details: {event.description[:200]}...")

    return "\n".join(lines)


def generate_audit_summary(event) -> str:
    """Generate audit/report summary with key metrics."""
    type_label = event.get_record_type_display()

    # Calculate response time if applicable
    response_time = None
    if event.detected_at and event.occurred_at:
        delta = event.detected_at - event.occurred_at
        response_time = format_duration(delta.total_seconds())

    # Calculate resolution time if applicable
    resolution_time = None
    if event.resolved_at and event.occurred_at:
        delta = event.resolved_at - event.occurred_at
        resolution_time = format_duration(delta.total_seconds())

    lines = [
        f"Type: {type_label}",
        f"Title: {event.title}",
        f"Contract: {event.contract.name}",
        f"Occurred: {format_datetime(event.occurred_at)}",
    ]

    if response_time:
        lines.append(f"Detection Time: {response_time}")

    if resolution_time:
        lines.append(f"Resolution Time: {resolution_time}")
    else:
        lines.append("Resolution: Pending")

    lines.append(f"Customer Notified: {'Yes' if event.customer_notified else 'No'}")

    if event.customer_notified and event.customer_notified_at:
        lines.append(
            f"Notification Time: {format_datetime(event.customer_notified_at)}"
        )

    if event.related_event:
        lines.append(f"Related Event: {event.related_event.title}")

    return "\n".join(lines)


def format_datetime(dt: datetime) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M")


def format_duration(seconds: float) -> str:
    """Format duration in human-readable form."""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        return f"{int(seconds / 60)}m"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"
    else:
        days = int(seconds / 86400)
        hours = int((seconds % 86400) / 3600)
        return f"{days}d {hours}h"
