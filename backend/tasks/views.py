"""Task API views."""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.auth import CustomJWTAuthentication

from .models import Task
from .serializers import (
    TaskApproveSerializer,
    TaskCreateSerializer,
    TaskListSerializer,
    TaskSerializer,
)
from .services import TaskService


class TaskViewSet(ModelViewSet):
    """ViewSet for Task CRUD operations."""

    queryset = Task.objects.select_related("contract").all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return TaskListSerializer
        if self.action == "create":
            return TaskCreateSerializer
        if self.action == "approve":
            return TaskApproveSerializer
        return TaskSerializer

    def get_queryset(self):
        """Filter by contract if provided."""
        queryset = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new task."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = TaskService.create(serializer.validated_data)
        output_serializer = TaskSerializer(task)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a task."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = TaskService.update(instance, serializer.validated_data)
        output_serializer = TaskSerializer(task)
        return Response(output_serializer.data)

    @action(
        detail=True, methods=["post"], authentication_classes=[CustomJWTAuthentication]
    )
    def approve(self, request, pk=None):
        """Approve or reject a task.

        Only PM and Admin roles can approve tasks.
        """
        task = self.get_object()

        # Check if task requires approval
        if not task.approval_required:
            return Response(
                {"error": {"message": "이 작업은 승인이 필요하지 않습니다."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already processed
        if task.approval_status in ["approved", "rejected"]:
            return Response(
                {"error": {"message": "이미 처리된 작업입니다."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get user info from JWT token
        user = getattr(request, "user", None)
        user_role = None
        user_name = "Unknown"

        if hasattr(request, "jwt_token") and request.jwt_token:
            user_role = request.jwt_token.get("role")
            user_name = request.jwt_token.get("display_name", "Unknown")

        # Check permission (only PM or Admin can approve)
        if user_role not in ["pm", "admin"]:
            return Response(
                {
                    "error": {
                        "message": "승인 권한이 없습니다. PM 또는 관리자만 승인할 수 있습니다."
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data["action"]

        if action_type == "approve":
            task.approval_status = "approved"
        else:
            task.approval_status = "rejected"

        task.approved_by = user_name
        task.approved_at = timezone.now()
        task.save()

        output_serializer = TaskSerializer(task)
        return Response(output_serializer.data)
