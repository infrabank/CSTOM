"""DecisionLog model for immutable decision records."""

from django.db import models

from tasks.models import Task


class DecisionLog(models.Model):
    """Immutable record of why a decision was made for a Task."""

    ACTOR_ROLES = [
        ("pm", "Project Manager"),
        ("engineer", "Engineer"),
        ("joint", "Joint Decision"),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="decision_logs",
    )
    actor_role = models.CharField(max_length=20, choices=ACTOR_ROLES)
    rationale_checklist = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured flags for rationale categories",
    )
    rationale_notes = models.TextField(blank=True)
    alternatives_considered = models.BooleanField(default=False)
    risk_acknowledged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Decision for {self.task.title} by {self.get_actor_role_display()}"

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError(
                "DecisionLog records are append-only and cannot be modified."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("DecisionLog records cannot be deleted.")
