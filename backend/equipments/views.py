"""Equipment API views."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsPMOrAdmin, IsPMOrEngineer

from .models import Equipment, EquipmentTransaction
from .serializers import (
    EquipmentSerializer,
    EquipmentListSerializer,
    EquipmentCreateSerializer,
    EquipmentTransactionSerializer,
    EquipmentTransactionCreateSerializer,
)
from .services import EquipmentService


class EquipmentViewSet(ModelViewSet):
    """ViewSet for Equipment CRUD operations."""

    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ["list", "retrieve", "transactions"]:
            return [AllowAny()]
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsPMOrAdmin()]
        if self.action in ["check_out", "check_in"]:
            return [IsPMOrEngineer()]
        return [IsPMOrAdmin()]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return EquipmentListSerializer
        if self.action == "create":
            return EquipmentCreateSerializer
        if self.action in ["check_out", "check_in"]:
            return EquipmentTransactionCreateSerializer
        return EquipmentSerializer

    def create(self, request, *args, **kwargs):
        """Create a new equipment."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        equipment = EquipmentService.create(serializer.validated_data)
        output_serializer = EquipmentSerializer(equipment)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update an equipment."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = EquipmentCreateSerializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        equipment = EquipmentService.update(instance, serializer.validated_data)
        output_serializer = EquipmentSerializer(equipment)
        return Response(output_serializer.data)

    @action(detail=True, methods=["post"], url_path="check-out")
    def check_out(self, request, pk=None):
        """Check out equipment."""
        equipment = self.get_object()
        serializer = EquipmentTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            transaction = EquipmentService.check_out(
                equipment=equipment,
                handler_name=serializer.validated_data["handler_name"],
                handler_affiliation=serializer.validated_data.get(
                    "handler_affiliation", ""
                ),
                handler_contact=serializer.validated_data.get("handler_contact", ""),
                purpose=serializer.validated_data.get("purpose", ""),
                expected_return_date=serializer.validated_data.get(
                    "expected_return_date"
                ),
                notes=serializer.validated_data.get("notes", ""),
            )
            return Response(
                EquipmentTransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        """Check in equipment."""
        equipment = self.get_object()
        serializer = EquipmentTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            transaction = EquipmentService.check_in(
                equipment=equipment,
                handler_name=serializer.validated_data["handler_name"],
                handler_affiliation=serializer.validated_data.get(
                    "handler_affiliation", ""
                ),
                handler_contact=serializer.validated_data.get("handler_contact", ""),
                notes=serializer.validated_data.get("notes", ""),
            )
            return Response(
                EquipmentTransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get all transactions for an equipment."""
        equipment = self.get_object()
        transactions = EquipmentService.get_transactions(equipment)
        serializer = EquipmentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
