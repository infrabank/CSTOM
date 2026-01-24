"""Task model for work units tied to contracts."""

from django.db import models

from contracts.models import Contract


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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_task_type_display()})"

    def save(self, *args, **kwargs):
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
