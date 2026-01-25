"""SLA Definition and Metric models for tracking service level agreements."""

from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from contracts.models import Contract


class SLADefinition(models.Model):
    """Service Level Agreement definition tied to a Contract."""

    PRIORITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="sla_definitions",
    )
    service_type = models.CharField(
        max_length=255,
        help_text="Type of service (e.g., Incident Response, Change Management)",
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        help_text="Priority level for this SLA",
    )
    target_response_time_minutes = models.PositiveIntegerField(
        help_text="Target response time in minutes"
    )
    target_resolution_time_minutes = models.PositiveIntegerField(
        help_text="Target resolution time in minutes"
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("contract", "service_type", "priority")

    def __str__(self):
        return f"{self.service_type} ({self.get_priority_display()}) - {self.contract.name}"


class SLAMetric(models.Model):
    """Actual SLA metric measurements for tasks or incidents."""

    sla_definition = models.ForeignKey(
        SLADefinition,
        on_delete=models.CASCADE,
        related_name="metrics",
    )

    # Generic foreign key to Task or ChangeIncident
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Actual measurements in minutes
    actual_response_time_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Actual response time in minutes",
    )
    actual_resolution_time_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Actual resolution time in minutes",
    )

    # SLA compliance
    response_sla_met = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether response time SLA was met",
    )
    resolution_sla_met = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether resolution time SLA was met",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"SLA Metric for {self.content_object} - {self.sla_definition.service_type}"
        )

    def save(self, *args, **kwargs):
        """Auto-calculate SLA compliance on save."""
        if self.actual_response_time_minutes is not None:
            self.response_sla_met = (
                self.actual_response_time_minutes
                <= self.sla_definition.target_response_time_minutes
            )

        if self.actual_resolution_time_minutes is not None:
            self.resolution_sla_met = (
                self.actual_resolution_time_minutes
                <= self.sla_definition.target_resolution_time_minutes
            )

        super().save(*args, **kwargs)
