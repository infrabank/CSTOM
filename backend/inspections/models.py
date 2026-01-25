"""Inspection scheduling and result tracking models."""

from django.conf import settings
from django.db import models

from contracts.models import Contract


class InspectionSchedule(models.Model):
    """Preventive inspection schedule for equipment."""

    CYCLE_CHOICES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="inspection_schedules",
        verbose_name="Contract",
    )
    equipment_type = models.CharField(
        max_length=100,
        verbose_name="Equipment Type",
        help_text="Type of equipment to inspect (e.g., Server, Network Device)",
    )
    cycle = models.CharField(
        max_length=20,
        choices=CYCLE_CHOICES,
        default="monthly",
        verbose_name="Inspection Cycle",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_inspection_schedules",
        verbose_name="Assigned To",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Inspection Description",
        help_text="Details about what should be inspected",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Inspection Schedule"
        verbose_name_plural = "Inspection Schedules"

    def __str__(self):
        return (
            f"{self.equipment_type} - {self.get_cycle_display()} ({self.contract.name})"
        )


class InspectionTask(models.Model):
    """Individual inspection task generated from a schedule."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    schedule = models.ForeignKey(
        InspectionSchedule,
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="Schedule",
    )
    scheduled_date = models.DateField(
        verbose_name="Scheduled Date",
        help_text="Date when inspection is scheduled",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_inspection_tasks",
        verbose_name="Assigned To",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Status",
    )
    notes = models.TextField(
        blank=True,
        verbose_name="Notes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-scheduled_date"]
        verbose_name = "Inspection Task"
        verbose_name_plural = "Inspection Tasks"

    def __str__(self):
        return f"{self.schedule.equipment_type} - {self.scheduled_date} ({self.get_status_display()})"


class InspectionResult(models.Model):
    """Result of a completed inspection task."""

    RESULT_CHOICES = [
        ("normal", "Normal"),
        ("abnormal", "Abnormal"),
        ("action_required", "Action Required"),
    ]

    task = models.ForeignKey(
        InspectionTask,
        on_delete=models.CASCADE,
        related_name="results",
        verbose_name="Task",
    )
    result = models.CharField(
        max_length=20,
        choices=RESULT_CHOICES,
        verbose_name="Result",
    )
    notes = models.TextField(
        blank=True,
        verbose_name="Notes",
        help_text="Detailed findings and observations",
    )
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="inspection_results",
        verbose_name="Completed By",
    )
    completed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Completed At",
    )

    class Meta:
        ordering = ["-completed_at"]
        verbose_name = "Inspection Result"
        verbose_name_plural = "Inspection Results"

    def __str__(self):
        return f"{self.task.schedule.equipment_type} - {self.get_result_display()} ({self.completed_at.date()})"
