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
            "approval_status",
            "approved_by",
            "approved_at",
            "title",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "approval_required",
            "approval_status",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]


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
            "approval_status",
            "title",
            "decision_count",
            "created_at",
        ]

    def get_decision_count(self, obj) -> int:
        return obj.decision_logs.count()


class TaskApproveSerializer(serializers.Serializer):
    """Serializer for approving/rejecting tasks."""

    action = serializers.ChoiceField(choices=["approve", "reject"])
    notes = serializers.CharField(required=False, allow_blank=True)


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
