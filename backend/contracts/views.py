"""Contract API views."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsPMOrAdmin, IsPMOrEngineer, ReadOnlyForCustomer

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

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ["list", "retrieve", "status_history"]:
            return [AllowAny()]  # Public read access for demo
        if self.action in ["create", "update", "partial_update", "destroy"]:
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
