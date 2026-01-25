"""
SLA calculation and violation detection logic.

Provides utilities for calculating elapsed time, determining SLA violations,
and checking warning thresholds.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from events.models import ChangeIncident
from sla.models import SLADefinition, SLAMetric
from tasks.models import Task

logger = logging.getLogger(__name__)


def get_sla_definition(
    contract_id: int, service_type: str, priority: str
) -> Optional[SLADefinition]:
    """
    Retrieve SLA definition for a contract, service type, and priority.

    Args:
        contract_id: Contract ID
        service_type: Service type (e.g., "Incident Response")
        priority: Priority level (critical, high, medium, low)

    Returns:
        SLADefinition instance or None if not found
    """
    try:
        return SLADefinition.objects.get(
            contract_id=contract_id,
            service_type=service_type,
            priority=priority,
            is_active=True,
        )
    except SLADefinition.DoesNotExist:
        logger.debug(
            f"No SLA definition found for contract {contract_id}, "
            f"service {service_type}, priority {priority}"
        )
        return None


def calculate_elapsed_minutes(
    start_time: datetime, end_time: Optional[datetime] = None
) -> int:
    """
    Calculate elapsed time in minutes between two timestamps.

    Args:
        start_time: Start datetime
        end_time: End datetime (defaults to now if None)

    Returns:
        Elapsed time in minutes
    """
    if end_time is None:
        end_time = timezone.now()

    elapsed = end_time - start_time
    return int(elapsed.total_seconds() / 60)


def check_response_sla_violation(
    task_or_incident,
    sla_definition: SLADefinition,
) -> Tuple[bool, int, int]:
    """
    Check if response SLA is violated for a task or incident.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_definition: SLADefinition instance

    Returns:
        Tuple of (is_violated, elapsed_minutes, target_minutes)
    """
    # Determine start time based on object type
    if isinstance(task_or_incident, Task):
        start_time = task_or_incident.created_at
    elif isinstance(task_or_incident, ChangeIncident):
        start_time = task_or_incident.occurred_at
    else:
        logger.warning(f"Unknown object type: {type(task_or_incident)}")
        return False, 0, 0

    elapsed = calculate_elapsed_minutes(start_time)
    target = sla_definition.target_response_time_minutes

    is_violated = elapsed > target
    return is_violated, elapsed, target


def check_resolution_sla_violation(
    task_or_incident,
    sla_definition: SLADefinition,
) -> Tuple[bool, int, int]:
    """
    Check if resolution SLA is violated for a task or incident.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_definition: SLADefinition instance

    Returns:
        Tuple of (is_violated, elapsed_minutes, target_minutes)
    """
    # Determine start time based on object type
    if isinstance(task_or_incident, Task):
        start_time = task_or_incident.created_at
    elif isinstance(task_or_incident, ChangeIncident):
        start_time = task_or_incident.occurred_at
    else:
        logger.warning(f"Unknown object type: {type(task_or_incident)}")
        return False, 0, 0

    elapsed = calculate_elapsed_minutes(start_time)
    target = sla_definition.target_resolution_time_minutes

    is_violated = elapsed > target
    return is_violated, elapsed, target


def check_warning_threshold(
    elapsed: int, target: int, threshold_percent: int = 80
) -> bool:
    """
    Check if elapsed time has reached warning threshold.

    Args:
        elapsed: Elapsed time in minutes
        target: Target time in minutes
        threshold_percent: Warning threshold as percentage (default 80%)

    Returns:
        True if warning threshold reached
    """
    warning_time = (target * threshold_percent) / 100
    return elapsed >= warning_time


def get_or_create_sla_metric(
    task_or_incident,
    sla_definition: SLADefinition,
) -> SLAMetric:
    """
    Get or create SLA metric for a task or incident.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_definition: SLADefinition instance

    Returns:
        SLAMetric instance
    """
    content_type = ContentType.objects.get_for_model(task_or_incident)

    metric, created = SLAMetric.objects.get_or_create(
        sla_definition=sla_definition,
        content_type=content_type,
        object_id=task_or_incident.id,
    )

    if created:
        logger.info(
            f"Created SLA metric for {task_or_incident} "
            f"with SLA {sla_definition.service_type}"
        )

    return metric


def update_sla_metric_response(
    metric: SLAMetric,
    elapsed_minutes: int,
) -> None:
    """
    Update response time metrics in SLA metric.

    Args:
        metric: SLAMetric instance
        elapsed_minutes: Actual response time in minutes
    """
    metric.actual_response_time_minutes = elapsed_minutes
    metric.save()
    logger.info(
        f"Updated response time for SLA metric {metric.id}: {elapsed_minutes} minutes"
    )


def update_sla_metric_resolution(
    metric: SLAMetric,
    elapsed_minutes: int,
) -> None:
    """
    Update resolution time metrics in SLA metric.

    Args:
        metric: SLAMetric instance
        elapsed_minutes: Actual resolution time in minutes
    """
    metric.actual_resolution_time_minutes = elapsed_minutes
    metric.save()
    logger.info(
        f"Updated resolution time for SLA metric {metric.id}: {elapsed_minutes} minutes"
    )
