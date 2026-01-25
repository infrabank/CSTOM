"""Notification system serializers."""

from rest_framework import serializers

from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""

    type_display = serializers.CharField(source="get_type_display", read_only=True)
    recipient_name = serializers.CharField(
        source="recipient.get_full_name", read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "recipient_name",
            "type",
            "type_display",
            "title",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "recipient", "created_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model."""

    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "user",
            "user_name",
            "email_enabled",
            "in_app_enabled",
            "notification_types",
        ]
        read_only_fields = ["id", "user"]
