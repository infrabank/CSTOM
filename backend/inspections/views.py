"""Inspection views."""

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import InspectionSchedule, InspectionTask, InspectionResult
from .serializers import (
    InspectionScheduleSerializer,
    InspectionTaskSerializer,
    InspectionTaskListSerializer,
    InspectionResultSerializer,
    TaskCompleteSerializer,
)


class StandardPagination(PageNumberPagination):
    """Standard pagination for inspection endpoints."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class InspectionScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for InspectionSchedule CRUD operations."""

    queryset = InspectionSchedule.objects.all()
    serializer_class = InspectionScheduleSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["is_active", "cycle", "contract"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]


class InspectionTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for InspectionTask CRUD operations with custom completion action."""

    queryset = InspectionTask.objects.all()
    serializer_class = InspectionTaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "scheduled_date", "schedule"]
    ordering_fields = ["scheduled_date", "created_at"]
    ordering = ["-scheduled_date"]

    def get_serializer_class(self):
        """Use lightweight serializer for list view."""
        if self.action == "list":
            return InspectionTaskListSerializer
        return InspectionTaskSerializer

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        """Mark inspection task as completed with result."""
        task = self.get_object()

        # Validate task is not already completed
        if task.status == "completed":
            return Response(
                {"detail": "Task is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate request data
        serializer = TaskCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update task status
        task.status = "completed"
        task.save()

        # Create inspection result
        result = InspectionResult.objects.create(
            task=task,
            result=serializer.validated_data["result"],
            notes=serializer.validated_data.get("notes", ""),
            completed_by=request.user,
        )

        # Return updated task with result
        task_serializer = InspectionTaskSerializer(task)
        return Response(task_serializer.data, status=status.HTTP_200_OK)


class InspectionResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for InspectionResult read-only operations."""

    queryset = InspectionResult.objects.all()
    serializer_class = InspectionResultSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["result", "task", "completed_at"]
    ordering_fields = ["completed_at"]
    ordering = ["-completed_at"]
