"""Equipment API views."""

from datetime import datetime, timedelta

from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from common.pagination import StandardPagination
from common.permissions import IsPMOrAdmin, IsPMOrEngineer, IsPMOrEngineerOrAdmin

from .authorization import AuthorizationDeniedError


def _authorization_error_response(e: AuthorizationDeniedError) -> Response:
    """Build standardized response for authorization denied errors."""
    return Response(
        {
            "error": str(e),
            "requires_pm": e.requires_pm,
            "approver_role": e.approver_role,
            "contract_status": e.contract_status,
        },
        status=status.HTTP_403_FORBIDDEN,
    )


from .models import Equipment, EquipmentTransaction, AssetRelationship, AssetHistory
from .serializers import (
    EquipmentSerializer,
    EquipmentListSerializer,
    EquipmentCreateSerializer,
    EquipmentTransactionSerializer,
    CheckOutSerializer,
    CheckInSerializer,
    CustodyHistoryResultSerializer,
    AssetRelationshipSerializer,
    AssetHistorySerializer,
)
from .services import (
    EquipmentService,
    CustodyHistoryService,
    CustodyHistoryFilters,
)


class EquipmentViewSet(ModelViewSet):
    """ViewSet for Equipment CRUD operations."""

    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        """Optimize queries with select_related and prefetch_related."""
        queryset = Equipment.objects.select_related("contract").prefetch_related(
            Prefetch(
                "transactions",
                queryset=EquipmentTransaction.objects.select_related(
                    "approver"
                ).order_by("-transaction_date"),
                to_attr="prefetched_transactions",
            )
        )
        for param_name, field in [
            ("status", "status"),
            ("category", "category"),
        ]:
            value = self.request.query_params.get(param_name)
            if value:
                queryset = queryset.filter(**{field: value})
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(serial_number__icontains=search)
                | Q(model_name__icontains=search)
                | Q(contract__name__icontains=search)
            )
        return queryset

    def get_permissions(self):
        if self.action in [
            "list",
            "retrieve",
            "transactions",
            "relationships",
            "history",
            "warranty_expiring",
        ]:
            return [IsAuthenticated()]
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsPMOrAdmin()]
        if self.action in ["check_out", "check_in"]:
            return [IsPMOrEngineerOrAdmin()]
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
        if self.action == "relationships":
            return AssetRelationshipSerializer
        if self.action == "history":
            return AssetHistorySerializer
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
            return _authorization_error_response(e)

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
            return _authorization_error_response(e)

    @action(detail=True, methods=["get"])
    def transactions(self, request, pk=None):
        """Get all transactions for an equipment."""
        equipment = self.get_object()
        transactions = EquipmentService.get_transactions(equipment)
        serializer = EquipmentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="custody-history")
    def custody_history(self, request, pk=None):
        """Task 009: Get custody history with filters."""
        equipment = self.get_object()

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        transaction_type = request.query_params.get("transaction_type")
        approver_role = request.query_params.get("approver_role")
        order = request.query_params.get("order", "asc")

        try:
            parsed_date_from = (
                datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
            )
            parsed_date_to = (
                datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
            )
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        filters = CustodyHistoryFilters(
            date_from=parsed_date_from,
            date_to=parsed_date_to,
            transaction_type=transaction_type,
            approver_role=approver_role,
            order=order if order in ["asc", "desc"] else "asc",
        )

        result = CustodyHistoryService.get_custody_history(equipment, filters)
        serializer = CustodyHistoryResultSerializer(result)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"], url_path="relationships")
    def relationships(self, request, pk=None):
        """Get or create equipment relationships."""
        equipment = self.get_object()

        if request.method == "GET":
            # List all relationships for this equipment
            relationships = AssetRelationship.objects.filter(equipment=equipment)
            serializer = AssetRelationshipSerializer(relationships, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            # Create new relationship
            serializer = AssetRelationshipSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(equipment=equipment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        """Get change history for equipment."""
        equipment = self.get_object()
        history = AssetHistory.objects.filter(equipment=equipment)

        # Paginate results
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = AssetHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = AssetHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="warranty-expiring")
    def warranty_expiring(self, request):
        """List equipment with warranty expiring soon (within 30/60/90 days)."""
        days = request.query_params.get("days", 30)
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 30

        today = timezone.localdate()
        expiry_date = today + timedelta(days=days)

        equipment = Equipment.objects.filter(
            warranty_expiry_date__isnull=False,
            warranty_expiry_date__lte=expiry_date,
            warranty_expiry_date__gte=today,
        ).select_related("contract")

        # Paginate results
        page = self.paginate_queryset(equipment)
        if page is not None:
            serializer = EquipmentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = EquipmentSerializer(equipment, many=True)
        return Response(serializer.data)
