"""Dashboard KPI calculation services."""

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg

from sla.models import SLAMetric
from inspections.models import InspectionTask
from tasks.models import Task
from events.models import ChangeIncident


def get_period_dates(period="week"):
    """Calculate start and end dates based on period."""
    now = timezone.now()

    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now
    elif period == "week":
        start_date = now - timedelta(days=7)
        end_date = now
    elif period == "month":
        start_date = now - timedelta(days=30)
        end_date = now
    elif period == "quarter":
        start_date = now - timedelta(days=90)
        end_date = now
    else:
        # Default to week
        start_date = now - timedelta(days=7)
        end_date = now

    return start_date, end_date


def calculate_sla_compliance_rate(start_date, end_date):
    """
    Calculate SLA compliance rate.

    Formula: (SLA met count / total SLA metrics) * 100
    """
    metrics = SLAMetric.objects.filter(
        created_at__gte=start_date, created_at__lte=end_date
    )

    if not metrics.exists():
        return 0.0

    total_metrics = metrics.count()

    # Count metrics where either response or resolution SLA was met
    met_count = metrics.filter(
        Q(response_sla_met=True) | Q(resolution_sla_met=True)
    ).count()

    compliance_rate = (met_count / total_metrics) * 100 if total_metrics > 0 else 0.0
    return round(compliance_rate, 2)


def calculate_mttr(start_date, end_date):
    """
    Calculate Mean Time To Resolution (MTTR) in hours.

    Formula: Average time from occurred_at to resolved_at (computed in DB).
    """
    from django.db.models import F, ExpressionWrapper, DurationField

    result = ChangeIncident.objects.filter(
        record_type="incident",
        occurred_at__gte=start_date,
        occurred_at__lte=end_date,
        resolved_at__isnull=False,
    ).annotate(
        resolution_duration=ExpressionWrapper(
            F("resolved_at") - F("occurred_at"),
            output_field=DurationField(),
        )
    ).aggregate(avg_duration=Avg("resolution_duration"))

    avg_duration = result["avg_duration"]
    if avg_duration is None:
        return 0.0

    mttr_hours = avg_duration.total_seconds() / 3600
    return round(mttr_hours, 2)


def calculate_inspection_completion_rate(start_date, end_date):
    """
    Calculate preventive inspection completion rate.

    Formula: (completed inspection tasks / total scheduled tasks) * 100
    """
    inspection_tasks = InspectionTask.objects.filter(
        scheduled_date__gte=start_date.date(), scheduled_date__lte=end_date.date()
    )

    if not inspection_tasks.exists():
        return 0.0

    total_tasks = inspection_tasks.count()
    completed_tasks = inspection_tasks.filter(status="completed").count()

    completion_rate = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0.0
    return round(completion_rate, 2)


def get_task_status_summary(start_date, end_date):
    """
    Get inspection task status summary.

    Returns: Dict with counts by status (pending, in_progress, completed)
    """
    inspection_tasks = InspectionTask.objects.filter(
        created_at__gte=start_date, created_at__lte=end_date
    )

    summary = {
        "total": 0,
        "pending": 0,
        "in_progress": 0,
        "completed": 0,
    }

    # Count inspection tasks by status
    status_counts = inspection_tasks.values("status").annotate(count=Count("id"))

    for item in status_counts:
        status = item["status"]
        if status in summary:
            summary[status] = item["count"]
        summary["total"] += item["count"]

    return summary


def get_dashboard_summary(period="week"):
    """
    Get complete dashboard summary with all KPIs.

    Returns: Dict with all 4 KPIs and period information
    """
    start_date, end_date = get_period_dates(period)

    return {
        "sla_compliance_rate": calculate_sla_compliance_rate(start_date, end_date),
        "mttr_hours": calculate_mttr(start_date, end_date),
        "inspection_completion_rate": calculate_inspection_completion_rate(
            start_date, end_date
        ),
        "task_summary": get_task_status_summary(start_date, end_date),
        "period": period,
        "start_date": start_date.date().isoformat(),
        "end_date": end_date.date().isoformat(),
    }
