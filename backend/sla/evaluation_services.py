"""SLA evaluation business logic: penalty calculation, score adjustments, and auto-evaluation."""

from decimal import Decimal

from django.db.models import Avg, Q

from events.models import ChangeIncident
from sla.models import SLAPenalty, PerformanceImprovement, UptimeRecord, SLAEvaluationItem


def calculate_penalties(report):
    """Auto-generate penalty records based on evaluation results.

    Rules (Article 15):
    - Grade C: 1% of monthly contract amount
    - Grade D: 2% of monthly contract amount
    - Item-level: service_level < 0.6 = 2% per item
    """
    penalties = []

    # Overall penalty based on grade
    if report.grade == "C":
        penalties.append(
            SLAPenalty(
                report=report,
                penalty_type="overall",
                penalty_rate=Decimal("1"),
                notes="종합평가 C등급 벌점",
            )
        )
    elif report.grade == "D":
        penalties.append(
            SLAPenalty(
                report=report,
                penalty_type="overall",
                penalty_rate=Decimal("2"),
                notes="종합평가 D등급 벌점",
            )
        )

    # Item-level penalty (service_level < 0.6 = below minimum)
    for score in report.scores.filter(service_level__lt=Decimal("0.6")):
        penalties.append(
            SLAPenalty(
                report=report,
                penalty_type="item_level",
                evaluation_item=score.evaluation_item,
                penalty_rate=Decimal("2"),
                notes=f"{score.evaluation_item.name} 최소수준 미만 벌점",
            )
        )

    # Calculate penalty amounts if contract has monthly_amount
    monthly_amount = report.contract.monthly_contract_amount
    if monthly_amount:
        for p in penalties:
            p.penalty_amount = monthly_amount * p.penalty_rate / 100

    # Replace existing penalties for this report
    SLAPenalty.objects.filter(report=report).delete()
    if penalties:
        SLAPenalty.objects.bulk_create(penalties)

    return penalties


def calculate_adjustment_points(report):
    """Calculate bonus/penalty adjustments for duplicate incidents and improvements.

    Rules (Article 14):
    - Duplicate incidents in period: -1 each
    - Accepted improvements in period: +1 each

    Returns:
        Tuple of (adjustment_points, duplicate_count, improvement_count)
    """
    # Duplicate incidents in period: -1 each
    duplicate_count = ChangeIncident.objects.filter(
        contract=report.contract,
        is_duplicate=True,
        occurred_at__date__gte=report.evaluation_period_start,
        occurred_at__date__lte=report.evaluation_period_end,
    ).count()

    # Accepted improvements in period: +1 each
    improvement_count = PerformanceImprovement.objects.filter(
        contract=report.contract,
        is_accepted=True,
        evaluation_period_start__gte=report.evaluation_period_start,
        evaluation_period_end__lte=report.evaluation_period_end,
    ).count()

    adjustment = improvement_count - duplicate_count
    return adjustment, duplicate_count, improvement_count


# ---------------------------------------------------------------------------
# Auto-evaluation: calculate service levels from existing data
# ---------------------------------------------------------------------------

# Item number → category mapping for uptime items
_UPTIME_ITEM_CATEGORY_MAP = {
    5: "server",
    6: "network",
    7: "security",
}

# Uptime thresholds: (min_percentage, service_level)
_UPTIME_THRESHOLDS = [
    (Decimal("99.5"), Decimal("1.0")),
    (Decimal("99.0"), Decimal("0.8")),
    (Decimal("98.5"), Decimal("0.6")),
    (Decimal("98.0"), Decimal("0.4")),
]

# Severity weights: severity 1 = 1.0, severity 2 = 0.5, severity 3 = excluded
_SEVERITY_WEIGHTS = {
    1: Decimal("1.0"),
    2: Decimal("0.5"),
    3: Decimal("0"),
}

# Weighted incident count thresholds: (max_weighted_count, service_level)
_INCIDENT_COUNT_THRESHOLDS = [
    (Decimal("0"), Decimal("1.0")),
    (Decimal("1"), Decimal("0.8")),
    (Decimal("2"), Decimal("0.6")),
    (Decimal("3"), Decimal("0.4")),
]

# On-time rate thresholds: (min_percentage, service_level)
_ONTIME_THRESHOLDS = [
    (100.0, Decimal("1.0")),
    (95.0, Decimal("0.8")),
    (90.0, Decimal("0.6")),
    (85.0, Decimal("0.4")),
]


def _level_from_uptime(avg_uptime):
    """Map average uptime percentage to service level."""
    if avg_uptime is None:
        return None
    for threshold, level in _UPTIME_THRESHOLDS:
        if avg_uptime >= threshold:
            return level
    return Decimal("0.2")


def _level_from_incident_count(weighted_count):
    """Map weighted incident count to service level."""
    for threshold, level in _INCIDENT_COUNT_THRESHOLDS:
        if weighted_count <= threshold:
            return level
    return Decimal("0.2")


def _level_from_ontime_rate(rate):
    """Map on-time maintenance rate to service level."""
    if rate is None:
        return None
    for threshold, level in _ONTIME_THRESHOLDS:
        if rate >= threshold:
            return level
    return Decimal("0.2")


def auto_evaluate(contract, period_start, period_end):
    """Auto-calculate service levels for items with available data.

    Returns:
        dict: {item_number: {"service_level": Decimal, "notes": str, "metric_value": str}}
        Only includes items where auto-calculation was possible.
    """
    from tasks.models import Task

    results = {}

    # --- Item 1: Weighted incident count in period ---
    # Severity 1 = 1.0건, Severity 2 = 0.5건, Severity 3/미설정 = 제외
    incidents = ChangeIncident.objects.filter(
        contract=contract,
        record_type="incident",
        occurred_at__date__gte=period_start,
        occurred_at__date__lte=period_end,
    ).values_list("severity", flat=True)

    total_raw = len(incidents)
    weighted_count = Decimal("0")
    severity_breakdown = {1: 0, 2: 0, 3: 0, None: 0}
    for sev in incidents:
        severity_breakdown[sev] = severity_breakdown.get(sev, 0) + 1
        weight = _SEVERITY_WEIGHTS.get(sev, Decimal("0"))
        weighted_count += weight

    level = _level_from_incident_count(weighted_count)
    breakdown_parts = []
    if severity_breakdown.get(1, 0):
        breakdown_parts.append(f"심각도1: {severity_breakdown[1]}건(x1.0)")
    if severity_breakdown.get(2, 0):
        breakdown_parts.append(f"심각도2: {severity_breakdown[2]}건(x0.5)")
    if severity_breakdown.get(3, 0):
        breakdown_parts.append(f"심각도3: {severity_breakdown[3]}건(제외)")
    if severity_breakdown.get(None, 0):
        breakdown_parts.append(f"미분류: {severity_breakdown[None]}건(제외)")
    breakdown_str = ", ".join(breakdown_parts) if breakdown_parts else "장애 없음"

    results[1] = {
        "service_level": str(level),
        "notes": f"자동산출: 총 {total_raw}건, 가중치 적용 {weighted_count}건 ({breakdown_str})",
        "metric_value": str(weighted_count),
    }

    # --- Item 2: On-time maintenance rate ---
    # Tasks completed in the period that have target_completion_hours
    tasks_in_period = Task.objects.filter(
        contract=contract,
        created_at__date__gte=period_start,
        created_at__date__lte=period_end,
    ).exclude(target_completion_hours__isnull=True)

    total_tasks = tasks_in_period.count()
    if total_tasks > 0:
        on_time_count = 0
        for task in tasks_in_period:
            if task.updated_at and task.target_completion_hours:
                elapsed_hours = (task.updated_at - task.created_at).total_seconds() / 3600
                if elapsed_hours <= task.target_completion_hours:
                    on_time_count += 1
        rate = (on_time_count / total_tasks) * 100
        level = _level_from_ontime_rate(rate)
        results[2] = {
            "service_level": str(level),
            "notes": f"자동산출: {on_time_count}/{total_tasks}건 적기처리 ({rate:.1f}%)",
            "metric_value": f"{rate:.1f}%",
        }

    # --- Items 5, 6, 7: Uptime by equipment category ---
    for item_number, equip_category in _UPTIME_ITEM_CATEGORY_MAP.items():
        avg_uptime = UptimeRecord.objects.filter(
            contract=contract,
            equipment__category=equip_category,
            period_start__gte=period_start,
            period_end__lte=period_end,
        ).aggregate(avg=Avg("uptime_percentage"))["avg"]

        if avg_uptime is not None:
            level = _level_from_uptime(avg_uptime)
            category_labels = {
                "server": "서버",
                "network": "네트워크",
                "security": "보안솔루션",
            }
            label = category_labels.get(equip_category, equip_category)
            results[item_number] = {
                "service_level": str(level),
                "notes": f"자동산출: {label} 평균 가동율 {avg_uptime:.2f}%",
                "metric_value": f"{avg_uptime:.2f}%",
            }

    return results
