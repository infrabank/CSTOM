"""Workforce API views."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import EngineerProfile, Schedule
from .serializers import (
    EngineerProfileSerializer,
    ScheduleListSerializer,
    ScheduleSerializer,
)


class EngineerProfileViewSet(ModelViewSet):
    """ViewSet for engineer profile CRUD operations."""

    queryset = EngineerProfile.objects.select_related("user").all()
    serializer_class = EngineerProfileSerializer
    permission_classes = [IsAuthenticated]


class ScheduleViewSet(ModelViewSet):
    """ViewSet for schedule CRUD operations."""

    queryset = Schedule.objects.select_related("engineer").all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return ScheduleListSerializer
        return ScheduleSerializer

    def get_queryset(self):
        """Filter by engineer or date range if provided."""
        queryset = super().get_queryset()
        engineer_id = self.request.query_params.get("engineer")
        if engineer_id:
            queryset = queryset.filter(engineer_id=engineer_id)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        schedule_type = self.request.query_params.get("type")
        if schedule_type:
            queryset = queryset.filter(schedule_type=schedule_type)
        return queryset
