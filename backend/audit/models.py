"""Audit event model for append-only audit trail."""

from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    """Append-only audit trail for all critical actions."""

    ACTION_TYPES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("role_change", "Role Change"),
        ("permission_denied", "Permission Denied"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_events",
    )
    actor_role = models.CharField(max_length=50, blank=True)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)
    request_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    before_snapshot = models.JSONField(null=True, blank=True)
    after_snapshot = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["actor", "occurred_at"]),
        ]

    def __str__(self):
        actor_str = self.actor.username if self.actor else "system"
        return (
            f"{self.action_type} on {self.entity_type}:{self.entity_id} by {actor_str}"
        )

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError(
                "AuditEvent records are append-only and cannot be modified."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("AuditEvent records cannot be deleted.")
