"""Inspection serializers."""

from rest_framework import serializers

from .models import InspectionSchedule, InspectionTask, InspectionResult


class InspectionResultSerializer(serializers.ModelSerializer):
    """Serializer for InspectionResult model."""

    completed_by_name = serializers.CharField(
        source="completed_by.get_full_name", read_only=True
    )

    class Meta:
        model = InspectionResult
        fields = [
            "id",
            "task",
            "result",
            "notes",
            "completed_by",
            "completed_by_name",
            "completed_at",
        ]
        read_only_fields = ["id", "completed_at"]


class InspectionTaskSerializer(serializers.ModelSerializer):
    """Serializer for InspectionTask model with nested results."""

    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    schedule_equipment = serializers.CharField(
        source="schedule.equipment_type", read_only=True
    )
    results = InspectionResultSerializer(many=True, read_only=True)

    class Meta:
        model = InspectionTask
        fields = [
            "id",
            "schedule",
            "schedule_equipment",
            "scheduled_date",
            "assigned_to",
            "assigned_to_name",
            "status",
            "notes",
            "results",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InspectionTaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists."""

    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    schedule_equipment = serializers.CharField(
        source="schedule.equipment_type", read_only=True
    )
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = InspectionTask
        fields = [
            "id",
            "schedule",
            "schedule_equipment",
            "scheduled_date",
            "assigned_to",
            "assigned_to_name",
            "status",
            "result_count",
            "created_at",
        ]

    def get_result_count(self, obj) -> int:
        return obj.results.count()


class InspectionScheduleSerializer(serializers.ModelSerializer):
    """Serializer for InspectionSchedule model."""

    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    contract_name = serializers.CharField(source="contract.name", read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = InspectionSchedule
        fields = [
            "id",
            "contract",
            "contract_name",
            "equipment_type",
            "cycle",
            "assigned_to",
            "assigned_to_name",
            "description",
            "is_active",
            "task_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_task_count(self, obj) -> int:
        return obj.tasks.count()


class TaskCompleteSerializer(serializers.Serializer):
    """Serializer for completing inspection tasks."""

    result = serializers.ChoiceField(choices=["normal", "abnormal", "action_required"])
    notes = serializers.CharField(required=False, allow_blank=True)
