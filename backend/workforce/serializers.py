"""Workforce serializers for REST API."""

from datetime import date

from rest_framework import serializers

from .models import EngineerProfile, Schedule, Assignment


class EngineerProfileSerializer(serializers.ModelSerializer):
    """Serializer for engineer profiles with derived fields."""

    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source="user.email", read_only=True)
    skills = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    availability_status = serializers.SerializerMethodField()
    availability_status_display = serializers.SerializerMethodField()

    class Meta:
        model = EngineerProfile
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "skills",
            "specialization",
            "availability_status",
            "availability_status_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_user_name(self, obj) -> str:
        user = obj.user
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username

    def get_skills(self, obj) -> str:
        if isinstance(obj.skills, list):
            return ", ".join(obj.skills)
        return str(obj.skills) if obj.skills else ""

    def get_specialization(self, obj) -> str:
        if isinstance(obj.specializations, list):
            return ", ".join(obj.specializations)
        return str(obj.specializations) if obj.specializations else ""

    def get_availability_status(self, obj) -> str:
        """Derive availability from today's schedule."""
        today_schedule = Schedule.objects.filter(
            engineer=obj.user, date=date.today()
        ).first()
        if not today_schedule:
            return "available"
        mapping = {
            "work": "busy",
            "vacation": "on_leave",
            "sick_leave": "on_leave",
            "training": "busy",
            "other": "unavailable",
        }
        return mapping.get(today_schedule.schedule_type, "available")

    def get_availability_status_display(self, obj) -> str:
        status = self.get_availability_status(obj)
        labels = {
            "available": "가용",
            "busy": "업무중",
            "on_leave": "휴가",
            "unavailable": "불가",
        }
        return labels.get(status, status)


class ScheduleSerializer(serializers.ModelSerializer):
    """Serializer for schedule entries."""

    engineer_name = serializers.SerializerMethodField()
    schedule_type_display = serializers.CharField(
        source="get_schedule_type_display", read_only=True
    )

    class Meta:
        model = Schedule
        fields = [
            "id",
            "engineer",
            "engineer_name",
            "date",
            "schedule_type",
            "schedule_type_display",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_engineer_name(self, obj) -> str:
        user = obj.engineer
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username


class ScheduleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for schedule lists."""

    engineer_name = serializers.SerializerMethodField()
    schedule_type_display = serializers.CharField(
        source="get_schedule_type_display", read_only=True
    )

    class Meta:
        model = Schedule
        fields = [
            "id",
            "engineer",
            "engineer_name",
            "date",
            "schedule_type",
            "schedule_type_display",
            "notes",
            "created_at",
        ]

    def get_engineer_name(self, obj) -> str:
        user = obj.engineer
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username


class AssignmentSerializer(serializers.ModelSerializer):
    """Serializer for task assignments."""

    engineer_name = serializers.SerializerMethodField()
    task_title = serializers.CharField(source="task.title", read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "engineer",
            "engineer_name",
            "task",
            "task_title",
            "assigned_at",
            "completed_at",
        ]
        read_only_fields = ["id", "assigned_at"]

    def get_engineer_name(self, obj) -> str:
        user = obj.engineer
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username
