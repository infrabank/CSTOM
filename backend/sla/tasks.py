"""
Celery tasks for SLA violation detection and notification.

Monitors active tasks and incidents for SLA violations and sends
warning/violation emails to relevant stakeholders.
"""

import logging
from datetime import datetime

from celery import shared_task
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone

from common.email import send_notification_email
from events.models import ChangeIncident
from sla.models import SLADefinition, SLAMetric
from sla.services import (
    check_resolution_sla_violation,
    check_response_sla_violation,
    check_warning_threshold,
    get_or_create_sla_metric,
    get_sla_definition,
    update_sla_metric_resolution,
    update_sla_metric_response,
)
from tasks.models import Task

logger = logging.getLogger(__name__)


@shared_task
def check_sla_violations():
    """
    Periodic task to check for SLA violations and send notifications.

    Runs hourly to:
    1. Find all active tasks and incidents
    2. Check response and resolution SLA status
    3. Send warning email at 80% of target time
    4. Send violation email when SLA exceeded
    5. Update SLAMetric records

    Returns:
        dict: Summary of violations detected and emails sent
    """
    logger.info("Starting SLA violation check")

    violations_detected = 0
    warnings_sent = 0
    violations_sent = 0
    errors = 0

    # Check active tasks
    active_tasks = Task.objects.filter(
        Q(approval_status="approved") | Q(approval_required=False)
    ).select_related("contract")

    logger.info(f"Checking {active_tasks.count()} active tasks for SLA violations")

    for task in active_tasks:
        try:
            _check_task_sla(task)
        except Exception as e:
            errors += 1
            logger.error(f"Error checking SLA for task {task.id}: {str(e)}")

    # Check active incidents
    active_incidents = ChangeIncident.objects.filter(
        record_type="incident", resolved_at__isnull=True
    ).select_related("contract")

    logger.info(
        f"Checking {active_incidents.count()} active incidents for SLA violations"
    )

    for incident in active_incidents:
        try:
            _check_incident_sla(incident)
        except Exception as e:
            errors += 1
            logger.error(f"Error checking SLA for incident {incident.id}: {str(e)}")

    summary = {
        "violations_detected": violations_detected,
        "warnings_sent": warnings_sent,
        "violations_sent": violations_sent,
        "errors": errors,
        "total_tasks_checked": active_tasks.count(),
        "total_incidents_checked": active_incidents.count(),
    }

    logger.info(
        f"SLA violation check complete: {violations_detected} violations detected, "
        f"{warnings_sent} warnings sent, {violations_sent} violations sent, "
        f"{errors} errors"
    )

    return summary


def _check_task_sla(task: Task) -> None:
    """
    Check SLA status for a single task.

    Args:
        task: Task instance to check
    """
    # Get SLA definition for this task
    # Determine service type and priority from task
    service_type = "Task Management"
    priority = _determine_priority(task.impact_level)

    sla_def = get_sla_definition(task.contract_id, service_type, priority)
    if not sla_def:
        logger.debug(f"No SLA definition for task {task.id}")
        return

    # Get or create SLA metric
    metric = get_or_create_sla_metric(task, sla_def)

    # Check response SLA
    response_violated, response_elapsed, response_target = check_response_sla_violation(
        task, sla_def
    )

    if response_violated:
        # Update metric
        update_sla_metric_response(metric, response_elapsed)

        # Send violation email if not already sent
        if metric.response_sla_met is None or metric.response_sla_met:
            _send_response_violation_email(
                task, sla_def, response_elapsed, response_target
            )
            logger.warning(
                f"Response SLA violated for task {task.id}: "
                f"{response_elapsed}m > {response_target}m"
            )
    else:
        # Check warning threshold
        if check_warning_threshold(response_elapsed, response_target):
            # Send warning email if not already sent
            if not _has_warning_been_sent(metric, "response"):
                _send_response_warning_email(
                    task, sla_def, response_elapsed, response_target
                )
                logger.info(
                    f"Response SLA warning for task {task.id}: "
                    f"{response_elapsed}m approaching {response_target}m"
                )


def _check_incident_sla(incident: ChangeIncident) -> None:
    """
    Check SLA status for a single incident.

    Args:
        incident: ChangeIncident instance to check
    """
    # Get SLA definition for this incident
    service_type = "Incident Response"
    priority = _determine_incident_priority(incident)

    sla_def = get_sla_definition(incident.contract_id, service_type, priority)
    if not sla_def:
        logger.debug(f"No SLA definition for incident {incident.id}")
        return

    # Get or create SLA metric
    metric = get_or_create_sla_metric(incident, sla_def)

    # Check response SLA (from occurred_at to detected_at)
    if incident.detected_at:
        response_elapsed = int(
            (incident.detected_at - incident.occurred_at).total_seconds() / 60
        )
        response_target = sla_def.target_response_time_minutes
        response_violated = response_elapsed > response_target

        if response_violated:
            update_sla_metric_response(metric, response_elapsed)
            if metric.response_sla_met is None or metric.response_sla_met:
                _send_response_violation_email(
                    incident, sla_def, response_elapsed, response_target
                )
                logger.warning(
                    f"Response SLA violated for incident {incident.id}: "
                    f"{response_elapsed}m > {response_target}m"
                )
        else:
            if check_warning_threshold(response_elapsed, response_target):
                if not _has_warning_been_sent(metric, "response"):
                    _send_response_warning_email(
                        incident, sla_def, response_elapsed, response_target
                    )
                    logger.info(
                        f"Response SLA warning for incident {incident.id}: "
                        f"{response_elapsed}m approaching {response_target}m"
                    )

    # Check resolution SLA (from occurred_at to now, or to resolved_at)
    resolution_elapsed = int(
        (timezone.now() - incident.occurred_at).total_seconds() / 60
    )
    resolution_target = sla_def.target_resolution_time_minutes
    resolution_violated = resolution_elapsed > resolution_target

    if resolution_violated:
        update_sla_metric_resolution(metric, resolution_elapsed)
        if metric.resolution_sla_met is None or metric.resolution_sla_met:
            _send_resolution_violation_email(
                incident, sla_def, resolution_elapsed, resolution_target
            )
            logger.warning(
                f"Resolution SLA violated for incident {incident.id}: "
                f"{resolution_elapsed}m > {resolution_target}m"
            )
    else:
        if check_warning_threshold(resolution_elapsed, resolution_target):
            if not _has_warning_been_sent(metric, "resolution"):
                _send_resolution_warning_email(
                    incident, sla_def, resolution_elapsed, resolution_target
                )
                logger.info(
                    f"Resolution SLA warning for incident {incident.id}: "
                    f"{resolution_elapsed}m approaching {resolution_target}m"
                )


def _determine_priority(impact_level: str) -> str:
    """
    Map task impact level to SLA priority.

    Args:
        impact_level: Task impact level (none, partial, full)

    Returns:
        SLA priority (critical, high, medium, low)
    """
    mapping = {
        "full": "critical",
        "partial": "high",
        "none": "medium",
    }
    return mapping.get(impact_level, "low")


def _determine_incident_priority(incident: ChangeIncident) -> str:
    """
    Determine SLA priority for an incident.

    For now, default to high priority. Can be enhanced with
    incident severity field in future.

    Args:
        incident: ChangeIncident instance

    Returns:
        SLA priority
    """
    return "high"


def _has_warning_been_sent(metric: SLAMetric, sla_type: str) -> bool:
    """
    Check if warning email has already been sent for this metric.

    Uses a simple heuristic: if actual time is recorded but SLA not yet violated,
    warning was likely sent.

    Args:
        metric: SLAMetric instance
        sla_type: "response" or "resolution"

    Returns:
        True if warning likely already sent
    """
    if sla_type == "response":
        return metric.actual_response_time_minutes is not None
    elif sla_type == "resolution":
        return metric.actual_resolution_time_minutes is not None
    return False


def _send_response_warning_email(
    task_or_incident,
    sla_def: SLADefinition,
    elapsed: int,
    target: int,
) -> bool:
    """
    Send warning email when response SLA is approaching violation.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_def: SLADefinition instance
        elapsed: Elapsed time in minutes
        target: Target time in minutes

    Returns:
        True if email sent successfully
    """
    recipient = _get_recipient_email(task_or_incident)
    if not recipient:
        logger.warning(f"No recipient email for {task_or_incident}")
        return False

    subject = f"SLA Warning: Response Time Approaching - {task_or_incident}"
    remaining = target - elapsed
    hours_remaining = remaining / 60

    body = f"""
SLA Response Time Warning

Item: {task_or_incident}
Contract: {task_or_incident.contract.name}
Service Type: {sla_def.service_type}
Priority: {sla_def.get_priority_display()}

Current Status:
- Elapsed Time: {elapsed} minutes
- Target Time: {target} minutes
- Time Remaining: {remaining} minutes ({hours_remaining:.1f} hours)

This is a warning that the response SLA is approaching violation.
Please take action to meet the SLA target.

---
This is an automated notification from CSTOM.
""".strip()

    return send_notification_email(recipient=recipient, subject=subject, body=body)


def _send_response_violation_email(
    task_or_incident,
    sla_def: SLADefinition,
    elapsed: int,
    target: int,
) -> bool:
    """
    Send violation email when response SLA is breached.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_def: SLADefinition instance
        elapsed: Elapsed time in minutes
        target: Target time in minutes

    Returns:
        True if email sent successfully
    """
    recipient = _get_recipient_email(task_or_incident)
    if not recipient:
        logger.warning(f"No recipient email for {task_or_incident}")
        return False

    subject = f"SLA Violation: Response Time Exceeded - {task_or_incident}"
    exceeded_by = elapsed - target

    body = f"""
SLA Response Time Violation

Item: {task_or_incident}
Contract: {task_or_incident.contract.name}
Service Type: {sla_def.service_type}
Priority: {sla_def.get_priority_display()}

Violation Details:
- Elapsed Time: {elapsed} minutes
- Target Time: {target} minutes
- Exceeded By: {exceeded_by} minutes

The response SLA has been breached. Immediate action is required.

---
This is an automated notification from CSTOM.
""".strip()

    return send_notification_email(recipient=recipient, subject=subject, body=body)


def _send_resolution_warning_email(
    task_or_incident,
    sla_def: SLADefinition,
    elapsed: int,
    target: int,
) -> bool:
    """
    Send warning email when resolution SLA is approaching violation.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_def: SLADefinition instance
        elapsed: Elapsed time in minutes
        target: Target time in minutes

    Returns:
        True if email sent successfully
    """
    recipient = _get_recipient_email(task_or_incident)
    if not recipient:
        logger.warning(f"No recipient email for {task_or_incident}")
        return False

    subject = f"SLA Warning: Resolution Time Approaching - {task_or_incident}"
    remaining = target - elapsed
    hours_remaining = remaining / 60

    body = f"""
SLA Resolution Time Warning

Item: {task_or_incident}
Contract: {task_or_incident.contract.name}
Service Type: {sla_def.service_type}
Priority: {sla_def.get_priority_display()}

Current Status:
- Elapsed Time: {elapsed} minutes
- Target Time: {target} minutes
- Time Remaining: {remaining} minutes ({hours_remaining:.1f} hours)

This is a warning that the resolution SLA is approaching violation.
Please take action to meet the SLA target.

---
This is an automated notification from CSTOM.
""".strip()

    return send_notification_email(recipient=recipient, subject=subject, body=body)


def _send_resolution_violation_email(
    task_or_incident,
    sla_def: SLADefinition,
    elapsed: int,
    target: int,
) -> bool:
    """
    Send violation email when resolution SLA is breached.

    Args:
        task_or_incident: Task or ChangeIncident instance
        sla_def: SLADefinition instance
        elapsed: Elapsed time in minutes
        target: Target time in minutes

    Returns:
        True if email sent successfully
    """
    recipient = _get_recipient_email(task_or_incident)
    if not recipient:
        logger.warning(f"No recipient email for {task_or_incident}")
        return False

    subject = f"SLA Violation: Resolution Time Exceeded - {task_or_incident}"
    exceeded_by = elapsed - target

    body = f"""
SLA Resolution Time Violation

Item: {task_or_incident}
Contract: {task_or_incident.contract.name}
Service Type: {sla_def.service_type}
Priority: {sla_def.get_priority_display()}

Violation Details:
- Elapsed Time: {elapsed} minutes
- Target Time: {target} minutes
- Exceeded By: {exceeded_by} minutes

The resolution SLA has been breached. Immediate action is required.

---
This is an automated notification from CSTOM.
""".strip()

    return send_notification_email(recipient=recipient, subject=subject, body=body)


def _get_recipient_email(task_or_incident) -> str:
    """
    Get recipient email for notifications.

    For now, uses contract owner email. Can be enhanced to include
    task assignee or incident owner in future.

    Args:
        task_or_incident: Task or ChangeIncident instance

    Returns:
        Email address or empty string if not found
    """
    if hasattr(task_or_incident.contract, "owner") and task_or_incident.contract.owner:
        return task_or_incident.contract.owner.email or ""
    return ""
