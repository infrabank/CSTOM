"""Equipment API views."""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsPMOrAdmin, IsPMOrEngineer

from .authorization import AuthorizationDeniedError
from .models import Equipment, EquipmentTransaction
from .serializers import (
    EquipmentSerializer,
    EquipmentListSerializer,
    EquipmentCreateSerializer,
    EquipmentTransactionSerializer,
    CheckOutSerializer,
    CheckInSerializer,
)
from .services import EquipmentService


class EquipmentViewSet(ModelViewSet):
    """ViewSet for Equipment CRUD operations."""

    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "transactions"]:
            return [AllowAny()]
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsPMOrAdmin()]
        if self.action in ["check_out", "check_in"]:
            return [IsAuthenticated()]
        return [IsPMOrAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return EquipmentListSerializer
        if self.action == "create":
            return EquipmentCreateSerializer
        if self.action == "check_out":
            return CheckOutSerializer
        if self.action == "check_in":
            return CheckInSerializer
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
        equipment = self.get_object()
        serializer = CheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            transaction = EquipmentService.check_out(
                equipment=equipment,
                approver=request.user,
                handler_name=serializer.validated_data["handler_name"],
                handler_affiliation=serializer.validated_data["handler_affiliation"],
                handler_contact=serializer.validated_data["handler_contact"],
                rationale=serializer.validated_data["rationale"],
                expected_return_date=serializer.validated_data.get(
                    "expected_return_date"
                ),
                notes=serializer.validated_data.get("notes", ""),
                operational_context_type=serializer.validated_data.get(
                    "operational_context_type"
                ),
                operational_context_id=serializer.validated_data.get(
                    "operational_context_id"
                ),
            )
            return Response(
                EquipmentTransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED,
            )
        except AuthorizationDeniedError as e:
            return Response(
                {
                    "error": str(e),
                    "requires_pm": e.requires_pm,
                    "approver_role": e.approver_role,
                    "contract_status": e.contract_status,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    @action(detail=True, methods=["post"], url_path="check-in")
    def check_in(self, request, pk=None):
        equipment = self.get_object()
        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            transaction = EquipmentService.check_in(
                equipment=equipment,
                approver=request.user,
                handler_name=serializer.validated_data["handler_name"],
                handler_affiliation=serializer.validated_data["handler_affiliation"],
                handler_contact=serializer.validated_data["handler_contact"],
                rationale=serializer.validated_data["rationale"],
                notes=serializer.validated_data.get("notes", ""),
                operational_context_type=serializer.validated_data.get(
                    "operational_context_type"
                ),
                operational_context_id=serializer.validated_data.get(
                    "operational_context_id"
                ),
            )
            return Response(
                EquipmentTransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED,
            )
        except AuthorizationDeniedError as e:
            return Response(
                {
                    "error": str(e),
                    "requires_pm": e.requires_pm,
                    "approver_role": e.approver_role,
                    "contract_status": e.contract_status,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get all transactions for an equipment."""
        equipment = self.get_object()
        transactions = EquipmentService.get_transactions(equipment)
        serializer = EquipmentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
