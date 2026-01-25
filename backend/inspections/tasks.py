"""
Celery tasks for inspection automation.

Handles automatic inspection task generation and reminder notifications.
"""

import logging
from datetime import date, timedelta

from celery import shared_task
from django.db.models import Q

from common.email import send_notification_email
from inspections.models import InspectionSchedule, InspectionTask

logger = logging.getLogger(__name__)


@shared_task
def generate_inspection_tasks():
    """
    Generate inspection tasks for active schedules.

    Runs daily to check all active InspectionSchedule records and creates
    InspectionTask records for due inspections based on cycle (monthly/quarterly).

    Logic:
    - Query all InspectionSchedule with is_active=True
    - For each schedule, calculate next due date based on cycle
    - Check if InspectionTask already exists for this schedule+date
    - Create new InspectionTask if not exists
    - Send email notification to assigned_to user

    Returns:
        dict: Summary of tasks created and emails sent
    """
    logger.info("Starting inspection task generation")

    today = date.today()
    tasks_created = 0
    emails_sent = 0
    errors = 0

    # Get all active schedules
    active_schedules = InspectionSchedule.objects.filter(is_active=True).select_related(
        "assigned_to", "contract"
    )

    logger.info(f"Found {active_schedules.count()} active inspection schedules")

    for schedule in active_schedules:
        try:
            # Calculate next due date based on cycle
            scheduled_date = _calculate_next_due_date(schedule, today)

            # Check if task already exists for this schedule and date
            existing_task = InspectionTask.objects.filter(
                schedule=schedule, scheduled_date=scheduled_date
            ).exists()

            if existing_task:
                logger.debug(
                    f"Task already exists for {schedule.equipment_type} on {scheduled_date}"
                )
                continue

            # Create new inspection task
            task = InspectionTask.objects.create(
                schedule=schedule,
                scheduled_date=scheduled_date,
                assigned_to=schedule.assigned_to,
                status="pending",
                notes=f"Auto-generated task for {schedule.get_cycle_display()} inspection",
            )

            tasks_created += 1
            logger.info(
                f"Created inspection task: {schedule.equipment_type} for {scheduled_date}"
            )

            # Send email notification to assigned user
            if schedule.assigned_to.email:
                email_sent = _send_task_creation_email(task)
                if email_sent:
                    emails_sent += 1
            else:
                logger.warning(
                    f"No email address for user {schedule.assigned_to.username}"
                )

        except Exception as e:
            errors += 1
            logger.error(
                f"Error processing schedule {schedule.id} ({schedule.equipment_type}): {str(e)}"
            )

    summary = {
        "tasks_created": tasks_created,
        "emails_sent": emails_sent,
        "errors": errors,
        "total_schedules": active_schedules.count(),
    }

    logger.info(
        f"Inspection task generation complete: {tasks_created} tasks created, "
        f"{emails_sent} emails sent, {errors} errors"
    )

    return summary


@shared_task
def send_inspection_reminders():
    """
    Send reminder emails for inspection tasks due tomorrow.

    Runs daily to find InspectionTask records with scheduled_date = tomorrow
    and status=pending, then sends reminder emails to assigned users.

    Returns:
        dict: Summary of reminders sent
    """
    logger.info("Starting inspection reminder process")

    tomorrow = date.today() + timedelta(days=1)
    reminders_sent = 0
    errors = 0

    # Get all pending tasks scheduled for tomorrow
    pending_tasks = InspectionTask.objects.filter(
        scheduled_date=tomorrow, status="pending"
    ).select_related("schedule", "assigned_to", "schedule__contract")

    logger.info(f"Found {pending_tasks.count()} pending tasks due tomorrow")

    for task in pending_tasks:
        try:
            if task.assigned_to.email:
                email_sent = _send_reminder_email(task)
                if email_sent:
                    reminders_sent += 1
            else:
                logger.warning(f"No email address for user {task.assigned_to.username}")

        except Exception as e:
            errors += 1
            logger.error(f"Error sending reminder for task {task.id}: {str(e)}")

    summary = {
        "reminders_sent": reminders_sent,
        "errors": errors,
        "total_tasks": pending_tasks.count(),
    }

    logger.info(
        f"Inspection reminder process complete: {reminders_sent} reminders sent, {errors} errors"
    )

    return summary


def _calculate_next_due_date(
    schedule: InspectionSchedule, reference_date: date
) -> date:
    """
    Calculate the next due date for an inspection schedule.

    Args:
        schedule: InspectionSchedule instance
        reference_date: Date to calculate from (usually today)

    Returns:
        date: Next scheduled inspection date

    Logic:
        - Monthly: First day of current month
        - Quarterly: First day of current quarter (Jan/Apr/Jul/Oct)
    """
    year = reference_date.year
    month = reference_date.month

    if schedule.cycle == "monthly":
        # Schedule for first day of current month
        return date(year, month, 1)

    elif schedule.cycle == "quarterly":
        # Calculate current quarter start month (1, 4, 7, or 10)
        quarter_start_month = ((month - 1) // 3) * 3 + 1
        return date(year, quarter_start_month, 1)

    else:
        # Fallback to today if unknown cycle
        logger.warning(f"Unknown cycle type: {schedule.cycle}")
        return reference_date


def _send_task_creation_email(task: InspectionTask) -> bool:
    """
    Send email notification when a new inspection task is created.

    Args:
        task: InspectionTask instance

    Returns:
        bool: True if email sent successfully
    """
    subject = f"New Inspection Task: {task.schedule.equipment_type}"

    body = f"""
Hello {task.assigned_to.get_full_name() or task.assigned_to.username},

A new inspection task has been assigned to you:

Equipment Type: {task.schedule.equipment_type}
Contract: {task.schedule.contract.name}
Scheduled Date: {task.scheduled_date}
Inspection Cycle: {task.schedule.get_cycle_display()}

Description:
{task.schedule.description or "No description provided"}

Please complete this inspection by the scheduled date.

---
This is an automated notification from CSTOM.
""".strip()

    return send_notification_email(
        recipient=task.assigned_to.email, subject=subject, body=body
    )


def _send_reminder_email(task: InspectionTask) -> bool:
    """
    Send reminder email for inspection task due tomorrow.

    Args:
        task: InspectionTask instance

    Returns:
        bool: True if email sent successfully
    """
    subject = f"Reminder: Inspection Due Tomorrow - {task.schedule.equipment_type}"

    body = f"""
Hello {task.assigned_to.get_full_name() or task.assigned_to.username},

This is a reminder that you have an inspection task due tomorrow:

Equipment Type: {task.schedule.equipment_type}
Contract: {task.schedule.contract.name}
Scheduled Date: {task.scheduled_date}
Status: {task.get_status_display()}

Description:
{task.schedule.description or "No description provided"}

Please ensure this inspection is completed on time.

---
This is an automated reminder from CSTOM.
""".strip()

    return send_notification_email(
        recipient=task.assigned_to.email, subject=subject, body=body
    )
