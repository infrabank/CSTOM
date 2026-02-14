"""Serializers for audit events."""

from rest_framework import serializers

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    """Serializer for AuditEvent (read-only)."""

    actor_email = serializers.EmailField(source="actor.email", read_only=True, default=None)

    class Meta:
        model = AuditEvent
        fields = [
            "id",
            "actor",
            "actor_email",
            "actor_role",
            "action_type",
            "entity_type",
            "entity_id",
            "occurred_at",
            "request_id",
            "ip_address",
            "user_agent",
            "before_snapshot",
            "after_snapshot",
        ]
        read_only_fields = fields
