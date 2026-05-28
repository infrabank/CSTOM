"""Contract API views."""

from datetime import datetime

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.pagination import StandardPagination
from common.permissions import IsPMOrAdmin, IsPMOrEngineer, ReadOnlyForCustomer
from django.db.models import Q
from equipments.serializers import ContractEquipmentMovementsResultSerializer
from equipments.services import (
    ContractEquipmentMovementsService,
    ContractEquipmentFilters,
)

from .models import Contract
from .serializers import (
    ContractListSerializer,
    ContractSerializer,
    ContractStatusHistorySerializer,
    ContractStatusUpdateSerializer,
)
from .services import ContractService


class ContractViewSet(ModelViewSet):
    """ViewSet for Contract CRUD operations."""

    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    pagination_class = StandardPagination
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_queryset(self):
        """Filter by search term and status if provided."""
        queryset = super().get_queryset()
        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(client_org__icontains=search)
            )
        return queryset

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ["list", "retrieve", "status_history", "equipment_movements"]:
            return [IsAuthenticated()]
        if self.action in ["create", "update", "partial_update"]:
            return [IsPMOrAdmin()]
        if self.action in ["update_status"]:
            return [IsPMOrAdmin()]
        return [ReadOnlyForCustomer()]

    def get_serializer_class(self):
        """Use lightweight serializer for list action."""
        if self.action == "list":
            return ContractListSerializer
        if self.action == "update_status":
            return ContractStatusUpdateSerializer
        return ContractSerializer

    def create(self, request, *args, **kwargs):
        """Create a new contract."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contract = ContractService.create(serializer.validated_data)
        output_serializer = ContractSerializer(contract)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a contract."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        contract = ContractService.update(instance, serializer.validated_data)
        output_serializer = ContractSerializer(contract)
        return Response(output_serializer.data)

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        """Update contract status with validation."""
        contract = self.get_object()
        serializer = ContractStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_contract = ContractService.update_status(
            contract,
            serializer.validated_data["status"],
            serializer.validated_data.get("notes", ""),
        )

        output_serializer = ContractSerializer(updated_contract)
        return Response(output_serializer.data)

    @action(detail=True, methods=["get"], url_path="history")
    def status_history(self, request, pk=None):
        """Get contract status history."""
        contract = self.get_object()
        history = ContractService.get_status_history(contract)
        serializer = ContractStatusHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="equipment-movements")
    def equipment_movements(self, request, pk=None):
        """Task 010: Get equipment movements for contract with aggregation."""
        contract = self.get_object()

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        equipment_status = request.query_params.get("equipment_status")
        include_retired = (
            request.query_params.get("include_retired", "false").lower() == "true"
        )
        authorization_filter = request.query_params.get("authorization_filter")

        filters = ContractEquipmentFilters(
            date_from=(
                datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
            ),
            date_to=(
                datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
            ),
            equipment_status=equipment_status,
            include_retired=include_retired,
            authorization_filter=authorization_filter,
        )

        result = ContractEquipmentMovementsService.get_contract_equipment_movements(
            contract, filters
        )
        serializer = ContractEquipmentMovementsResultSerializer(result)
        return Response(serializer.data)
