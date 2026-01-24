"""Task API views."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet


from .models import Task
from .serializers import TaskCreateSerializer, TaskListSerializer, TaskSerializer
from .services import TaskService


class TaskViewSet(ModelViewSet):
    """ViewSet for Task CRUD operations.

    Authentication and permissions are disabled to allow public access
    for MVP phase. Production should implement proper auth.
    """

    queryset = Task.objects.select_related("contract").all()
    serializer_class = TaskSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

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
