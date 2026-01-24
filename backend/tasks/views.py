"""Task API views."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import ReadOnlyForCustomer

from .models import Task
from .serializers import TaskCreateSerializer, TaskListSerializer, TaskSerializer
from .services import TaskService


class TaskViewSet(ModelViewSet):
    """ViewSet for Task CRUD operations."""

    queryset = Task.objects.select_related("contract").all()
    serializer_class = TaskSerializer

    def get_authenticators(self):
        """Skip authentication for create action to allow public access."""
        if self.action == "create":
            return []
        return super().get_authenticators()

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [AllowAny()]
        return [ReadOnlyForCustomer()]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return TaskListSerializer
        if self.action == "create":
            return TaskCreateSerializer
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
