"""AI prediction services for equipment failure risk assessment.

Two data sources:
1. EquipmentMetric (pre-computed) - if records exist, use the latest metric directly.
2. Live calculation (fallback) - derive risk from ChangeIncident history + equipment age.
"""

import logging
from datetime import date, timedelta
from typing import Optional

from equipments.models import Equipment
from events.models import ChangeIncident

from .models import EquipmentMetric

logger = logging.getLogger(__name__)

# Weight coefficients for risk score calculation
WEIGHT_FAILURE_COUNT = 30.0  # max contribution
WEIGHT_FAILURE_RECENCY = 25.0  # max contribution
WEIGHT_AGE = 20.0  # max contribution
WEIGHT_MTBF = 25.0  # max contribution


def _calculate_age_days(equipment: Equipment) -> int:
    """Return equipment age in days from purchase_date or created_at."""
    if equipment.purchase_date:
        return (date.today() - equipment.purchase_date).days
    return (date.today() - equipment.created_at.date()).days


def _days_since_last_incident(equipment: Equipment) -> Optional[int]:
    """Return days since most recent incident for this equipment's contract."""
    last_incident = (
        ChangeIncident.objects.filter(
            contract=equipment.contract,
            record_type="incident",
        )
        .order_by("-occurred_at")
        .values_list("occurred_at", flat=True)
        .first()
    )
    if last_incident is None:
        return None
    return (date.today() - last_incident.date()).days


def _incident_count(equipment: Equipment, lookback_days: int = 365) -> int:
    """Count incidents for this equipment's contract in the lookback window."""
    since = date.today() - timedelta(days=lookback_days)
    return ChangeIncident.objects.filter(
        contract=equipment.contract,
        record_type="incident",
        occurred_at__date__gte=since,
    ).count()


def _compute_mtbf_days(failure_count: int, age_days: int) -> Optional[float]:
    """Compute mean time between failures in days."""
    if failure_count <= 0:
        return None
    return round(age_days / failure_count, 1)


def _compute_risk_score(
    failure_count: int,
    days_since_last: Optional[int],
    age_days: int,
    mtbf_days: Optional[float],
) -> float:
    """Compute composite risk score (0-100).

    Components:
    - Failure frequency (0-30): more failures = higher risk
    - Failure recency (0-25): more recent = higher risk
    - Equipment age (0-20): older = higher risk
    - MTBF penalty (0-25): shorter MTBF = higher risk
    """
    score = 0.0

    # 1. Failure count component (cap at 10 incidents for max score)
    capped_failures = min(failure_count, 10)
    score += (capped_failures / 10) * WEIGHT_FAILURE_COUNT

    # 2. Recency component (recent failures = higher risk)
    if days_since_last is not None:
        if days_since_last <= 7:
            recency_factor = 1.0
        elif days_since_last <= 30:
            recency_factor = 0.8
        elif days_since_last <= 90:
            recency_factor = 0.5
        elif days_since_last <= 180:
            recency_factor = 0.3
        else:
            recency_factor = 0.1
        score += recency_factor * WEIGHT_FAILURE_RECENCY

    # 3. Age component (cap at 5 years = 1825 days)
    capped_age = min(age_days, 1825)
    score += (capped_age / 1825) * WEIGHT_AGE

    # 4. MTBF component (shorter MTBF = higher risk, cap at 365 days)
    if mtbf_days is not None and mtbf_days > 0:
        mtbf_capped = min(mtbf_days, 365)
        mtbf_factor = 1.0 - (mtbf_capped / 365)
        score += mtbf_factor * WEIGHT_MTBF

    return round(min(score, 100.0), 1)


class PredictionService:
    """Service for equipment failure risk predictions."""

    @staticmethod
    def get_at_risk_equipment(min_risk_score: float = 0.0) -> list[dict]:
        """Return all equipment with risk assessment data.

        For each equipment, tries EquipmentMetric first (pre-computed).
        Falls back to live calculation from ChangeIncident history.

        Args:
            min_risk_score: Minimum risk score threshold (0-100).

        Returns:
            List of dicts matching AtRiskEquipmentSerializer fields,
            sorted by risk_score descending.
        """
        equipments = (
            Equipment.objects.exclude(status="retired").select_related("contract").all()
        )

        results = []
        for eq in equipments:
            metric = (
                EquipmentMetric.objects.filter(equipment=eq)
                .order_by("-metric_date")
                .first()
            )

            age_days = _calculate_age_days(eq)

            if metric:
                # Use pre-computed metric data
                failure_count = metric.failure_count
                mtbf_days = (
                    round(metric.mtbf_hours / 24, 1) if metric.mtbf_hours > 0 else None
                )
                days_since_last = _days_since_last_incident(eq)
                risk_score = metric.risk_score
            else:
                # Live calculation from incident history
                failure_count = _incident_count(eq)
                days_since_last = _days_since_last_incident(eq)
                mtbf_days = _compute_mtbf_days(failure_count, age_days)
                risk_score = _compute_risk_score(
                    failure_count, days_since_last, age_days, mtbf_days
                )

            if risk_score < min_risk_score:
                continue

            results.append(
                {
                    "id": eq.id,
                    "name": eq.name,
                    "serial_number": eq.serial_number,
                    "contract_name": eq.contract.name,
                    "risk_score": risk_score,
                    "failure_count": failure_count,
                    "days_since_last_failure": days_since_last,
                    "mtbf_days": mtbf_days,
                    "age_days": age_days,
                }
            )

        results.sort(key=lambda x: x["risk_score"], reverse=True)
        return results

    @staticmethod
    def recalculate_metrics(equipment: Equipment) -> EquipmentMetric:
        """Recalculate and store metrics for a single equipment item.

        Creates a new EquipmentMetric record for today with freshly
        computed values from incident history.
        """
        age_days = _calculate_age_days(equipment)
        failure_count = _incident_count(equipment)
        days_since_last = _days_since_last_incident(equipment)
        mtbf_days = _compute_mtbf_days(failure_count, age_days)
        risk_score = _compute_risk_score(
            failure_count, days_since_last, age_days, mtbf_days
        )

        metric, _ = EquipmentMetric.objects.update_or_create(
            equipment=equipment,
            metric_date=date.today(),
            defaults={
                "failure_count": failure_count,
                "mtbf_hours": (mtbf_days * 24) if mtbf_days else 0.0,
                "usage_hours": age_days * 24,
                "risk_score": risk_score,
            },
        )
        return metric
