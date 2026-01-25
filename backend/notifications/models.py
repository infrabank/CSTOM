"""Notification system models for user alerts and preferences."""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """User notification with type, content, and read status."""

    TYPE_CHOICES = [
        ("SLA_WARNING", "SLA Warning"),
        ("SLA_VIOLATION", "SLA Violation"),
        ("INSPECTION_DUE", "Inspection Due"),
        ("TICKET_ASSIGNED", "Ticket Assigned"),
        ("TICKET_UPDATED", "Ticket Updated"),
        ("STATUS_CHANGED", "Status Changed"),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=300)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        indexes = [
            models.Index(fields=["recipient", "-created_at"]),
            models.Index(fields=["recipient", "is_read"]),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.title} ({self.recipient.username})"


class NotificationPreference(models.Model):
    """User notification delivery preferences."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="notification_preference",
    )
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    notification_types = models.JSONField(
        default=dict,
        help_text="JSON object mapping notification types to enabled status",
    )

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"

    def __str__(self):
        return f"Notification preferences for {self.user.username}"
