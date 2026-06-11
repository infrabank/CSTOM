"""Task model for work units tied to contracts."""

from django.core.exceptions import ValidationError
from django.db import models

from contracts.models import Contract
from events.models import ChangeIncident


class Task(models.Model):
    """Unit of work tied to a Contract with auditability and decision trace."""

    TASK_TYPES = [
        ("routine", "Routine"),
        ("incident", "Incident"),
        ("change", "Change"),
        ("request", "Request"),
    ]

    IMPACT_LEVELS = [
        ("none", "None"),
        ("partial", "Partial"),
        ("full", "Full"),
    ]

    APPROVAL_STATUSES = [
        ("not_required", "Not Required"),
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    related_incident = models.ForeignKey(
        ChangeIncident,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
        help_text="연관 장애/변경 이벤트",
    )
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    impact_level = models.CharField(
        max_length=20, choices=IMPACT_LEVELS, default="none"
    )
    approval_required = models.BooleanField(default=False)
    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_STATUSES, default="not_required"
    )
    approved_by = models.CharField(max_length=255, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Request processing category (SLA)
    REQUEST_CATEGORY_CHOICES = [
        ("simple", "단순"),
        ("change", "변경"),
        ("replacement", "교체"),
    ]
    request_category = models.CharField(
        max_length=20, choices=REQUEST_CATEGORY_CHOICES, blank=True
    )
    target_completion_hours = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["contract", "task_type"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_task_type_display()})"

    # Target hours by request category
    REQUEST_TARGET_HOURS = {
        "simple": 72,
        "change": 168,
        "replacement": 336,
    }

    def save(self, *args, **kwargs):
        # Auto-set target_completion_hours based on request_category
        if self.request_category and not self.target_completion_hours:
            self.target_completion_hours = self.REQUEST_TARGET_HOURS.get(
                self.request_category
            )

        # Auto-derive approval_required and approval_status based on impact and type
        requires_approval = self.impact_level == "full" or self.task_type == "change"
        self.approval_required = requires_approval

        if requires_approval:
            # Set to pending if newly requiring approval
            if self.approval_status == "not_required":
                self.approval_status = "pending"
        else:
            # Reset to not_required if approval no longer needed
            # Keep approved/rejected as historical record
            if self.approval_status == "pending":
                self.approval_status = "not_required"

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "작업 기록은 삭제할 수 없습니다."
        )
