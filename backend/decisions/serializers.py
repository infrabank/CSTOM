"""DecisionLog serializers."""

from rest_framework import serializers

from .models import DecisionLog


class DecisionLogSerializer(serializers.ModelSerializer):
    """Serializer for DecisionLog model."""

    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = DecisionLog
        fields = [
            "id",
            "task",
            "task_title",
            "actor_role",
            "rationale_checklist",
            "rationale_notes",
            "alternatives_considered",
            "risk_acknowledged",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DecisionLogCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating decision logs."""

    class Meta:
        model = DecisionLog
        fields = [
            "task",
            "actor_role",
            "rationale_checklist",
            "rationale_notes",
            "alternatives_considered",
            "risk_acknowledged",
        ]

    def create(self, validated_data):
        return DecisionLog.objects.create(**validated_data)
