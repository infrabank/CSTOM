"""DecisionLog API views."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.errors import ImmutableRecordError
from common.permissions import IsPM, IsPMOrEngineerOrAdmin, ReadOnlyForCustomer

from .models import DecisionLog
from .serializers import DecisionLogCreateSerializer, DecisionLogSerializer
from .services import DecisionLogService


class DecisionLogViewSet(ModelViewSet):
    """ViewSet for DecisionLog operations (append-only)."""

    queryset = DecisionLog.objects.select_related("task").all()
    serializer_class = DecisionLogSerializer

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == "create":
            return [IsPMOrEngineerOrAdmin()]
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsPM()]  # Only PM can attempt (will still fail due to immutability)
        return [ReadOnlyForCustomer()]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "create":
            return DecisionLogCreateSerializer
        return DecisionLogSerializer

    def get_queryset(self):
        """Filter by task if provided."""
        queryset = super().get_queryset()
        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new decision log (append-only)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        decision = DecisionLogService.create(serializer.validated_data)
        output_serializer = DecisionLogSerializer(decision)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Decision logs are immutable."""
        raise ImmutableRecordError("DecisionLog records cannot be modified.")

    def destroy(self, request, *args, **kwargs):
        """Decision logs are immutable."""
        raise ImmutableRecordError("DecisionLog records cannot be deleted.")
