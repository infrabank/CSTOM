"""Report API views."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsPMOrAdmin, ReadOnlyForCustomer

from .models import Report
from .serializers import (
    ReportGenerateSerializer,
    ReportListSerializer,
    ReportSerializer,
)
from .services import ReportService


class ReportViewSet(ModelViewSet):
    """ViewSet for Report operations."""

    queryset = Report.objects.select_related("contract").all()
    serializer_class = ReportSerializer

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsPMOrAdmin()]
        return [ReadOnlyForCustomer()]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return ReportListSerializer
        if self.action == "create":
            return ReportGenerateSerializer
        return ReportSerializer

    def get_queryset(self):
        """Filter by contract if provided."""
        queryset = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        report_type = self.request.query_params.get("type")
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        return queryset

    def create(self, request, *args, **kwargs):
        """Generate a new report."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        report = ReportService.generate(
            contract_id=serializer.validated_data["contract"],
            report_type=serializer.validated_data["report_type"],
            period_start=serializer.validated_data["period_start"],
            period_end=serializer.validated_data["period_end"],
        )

        output_serializer = ReportSerializer(report)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
