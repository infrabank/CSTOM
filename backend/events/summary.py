"""Summary generation for change/incident events."""

from datetime import datetime


def generate_summaries(event) -> None:
    """Generate summary_notice and audit_summary for an event."""
    event.summary_notice = generate_notice_summary(event)
    event.audit_summary = generate_audit_summary(event)
    event.save(update_fields=["summary_notice", "audit_summary"])


def generate_notice_summary(event) -> str:
    """Generate 1st notice summary for customer communication."""
    type_label = "변경" if event.record_type == "change" else "장애"
    occurred = format_datetime(event.occurred_at)

    lines = [
        f"[{type_label}] {event.title}",
        f"발생 시각: {occurred}",
    ]

    if event.detected_at:
        lines.append(f"인지 시각: {format_datetime(event.detected_at)}")

    if event.resolved_at:
        lines.append(f"해결 시각: {format_datetime(event.resolved_at)}")
    else:
        lines.append("상태: 진행 중")

    if event.description:
        lines.append(f"상세 내용: {event.description[:200]}...")

    return "\n".join(lines)


def generate_audit_summary(event) -> str:
    """Generate audit/report summary with key metrics."""
    type_label = "변경" if event.record_type == "change" else "장애"

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
        f"유형: {type_label}",
        f"제목: {event.title}",
        f"계약: {event.contract.name}",
        f"발생 시각: {format_datetime(event.occurred_at)}",
    ]

    if response_time:
        lines.append(f"인지 소요 시간: {response_time}")

    if resolution_time:
        lines.append(f"해결 소요 시간: {resolution_time}")
    else:
        lines.append("해결: 진행 중")

    lines.append(f"고객 통보: {'완료' if event.customer_notified else '미완료'}")

    if event.customer_notified and event.customer_notified_at:
        lines.append(f"통보 시각: {format_datetime(event.customer_notified_at)}")

    if event.related_event:
        lines.append(f"연관 이벤트: {event.related_event.title}")

    return "\n".join(lines)


def format_datetime(dt: datetime) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M")


def format_duration(seconds: float) -> str:
    """Format duration in human-readable form."""
    if seconds < 60:
        return f"{int(seconds)}초"
    elif seconds < 3600:
        return f"{int(seconds / 60)}분"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}시간 {minutes}분"
    else:
        days = int(seconds / 86400)
        hours = int((seconds % 86400) / 3600)
        return f"{days}일 {hours}시간"
