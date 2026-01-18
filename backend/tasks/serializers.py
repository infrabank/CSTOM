"""Task serializers."""

from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "contract",
            "contract_name",
            "task_type",
            "impact_level",
            "approval_required",
            "title",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "approval_required", "created_at", "updated_at"]


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    decision_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "contract",
            "contract_name",
            "task_type",
            "impact_level",
            "approval_required",
            "title",
            "decision_count",
            "created_at",
        ]

    def get_decision_count(self, obj) -> int:
        return obj.decision_logs.count()


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks."""

    class Meta:
        model = Task
        fields = [
            "contract",
            "task_type",
            "impact_level",
            "title",
            "description",
        ]
