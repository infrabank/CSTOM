"""ChangeIncident API views."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import ReadOnlyForCustomer

from .models import ChangeIncident
from .serializers import (
    ChangeIncidentCreateSerializer,
    ChangeIncidentListSerializer,
    ChangeIncidentSerializer,
    LinkEventSerializer,
)
from .services import ChangeIncidentService


class ChangeIncidentViewSet(ModelViewSet):
    """ViewSet for ChangeIncident CRUD operations."""

    queryset = ChangeIncident.objects.select_related("contract", "related_event").all()
    serializer_class = ChangeIncidentSerializer
    permission_classes = [IsAuthenticated, ReadOnlyForCustomer]
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return ChangeIncidentListSerializer
        if self.action == "create":
            return ChangeIncidentCreateSerializer
        if self.action == "link":
            return LinkEventSerializer
        return ChangeIncidentSerializer

    def get_queryset(self):
        """Filter by contract if provided."""
        queryset = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        record_type = self.request.query_params.get("type")
        if record_type:
            queryset = queryset.filter(record_type=record_type)
        return queryset

    def create(self, request, *args, **kwargs):
        """Create a new event."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = ChangeIncidentService.create(serializer.validated_data)
        output_serializer = ChangeIncidentSerializer(event)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update an event."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        event = ChangeIncidentService.update(instance, serializer.validated_data)
        output_serializer = ChangeIncidentSerializer(event)
        return Response(output_serializer.data)

    @action(detail=True, methods=["post"])
    def link(self, request, pk=None):
        """Link this event to another event."""
        event = self.get_object()
        serializer = LinkEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_event = ChangeIncidentService.link_event(
            event, serializer.validated_data["related_event"]
        )

        output_serializer = ChangeIncidentSerializer(updated_event)
        return Response(output_serializer.data)

    @action(detail=False, methods=["get"], url_path="timeline")
    def timeline(self, request):
        """Get events as a timeline for a contract."""
        contract_id = request.query_params.get("contract")
        if not contract_id:
            return Response(
                {"error": "contract parameter required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        events = ChangeIncidentService.get_timeline(int(contract_id))
        serializer = ChangeIncidentListSerializer(events, many=True)
        return Response(serializer.data)
