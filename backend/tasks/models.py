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
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_task_type_display()})"

    def save(self, *args, **kwargs):
        # Auto-derive approval_required based on impact and type
        if self.impact_level == "full" or self.task_type == "change":
            self.approval_required = True
        super().save(*args, **kwargs)
