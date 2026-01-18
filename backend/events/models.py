"""ChangeIncident model for unified change and incident records."""

from django.db import models

from contracts.models import Contract


class ChangeIncident(models.Model):
    """Unified record for changes and incidents."""

    RECORD_TYPES = [
        ("change", "Change"),
        ("incident", "Incident"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="change_incidents",
    )
    record_type = models.CharField(max_length=20, choices=RECORD_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Timestamps
    occurred_at = models.DateTimeField()
    detected_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Customer notification
    customer_notified = models.BooleanField(default=False)
    customer_notified_at = models.DateTimeField(null=True, blank=True)

    # Related event (self-reference for linking changes to incidents)
    related_event = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_events",
    )

    # Auto-generated summaries
    summary_notice = models.TextField(blank=True, help_text="1st notice summary")
    audit_summary = models.TextField(blank=True, help_text="Audit/report summary")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-occurred_at"]
        verbose_name_plural = "Change/Incidents"

    def __str__(self):
        return f"[{self.get_record_type_display()}] {self.title}"

    def clean(self):
        from django.core.exceptions import ValidationError

        # Validate timestamp ordering
        if (
            self.detected_at
            and self.occurred_at
            and self.detected_at < self.occurred_at
        ):
            raise ValidationError("detected_at must be >= occurred_at")
        if (
            self.resolved_at
            and self.detected_at
            and self.resolved_at < self.detected_at
        ):
            raise ValidationError("resolved_at must be >= detected_at")
        if (
            self.resolved_at
            and self.occurred_at
            and self.resolved_at < self.occurred_at
        ):
            raise ValidationError("resolved_at must be >= occurred_at")
