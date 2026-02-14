"""SLA evaluation business logic: penalty calculation and score adjustments."""

from decimal import Decimal

from events.models import ChangeIncident
from sla.models import SLAPenalty, PerformanceImprovement


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
