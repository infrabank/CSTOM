"""SLA API views."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q, Case, When, IntegerField

from .models import SLADefinition, SLAMetric
from .serializers import (
    SLADefinitionSerializer,
    SLADefinitionListSerializer,
    SLAMetricSerializer,
    ComplianceSummarySerializer,
)


class StandardPagination(PageNumberPagination):
    """Standard pagination for API responses."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SLADefinitionViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA definitions with filtering and compliance tracking."""

    queryset = SLADefinition.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["contract", "priority", "is_active", "service_type"]
    search_fields = ["service_type", "description", "contract__name"]
    ordering_fields = ["created_at", "priority", "contract"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use list serializer for list action."""
        if self.action == "list":
            return SLADefinitionListSerializer
        return SLADefinitionSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by contract
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)

        # Filter by priority
        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset.prefetch_related("metrics")

    @action(detail=False, methods=["get"])
    def compliance(self, request):
        """Get compliance summary by contract."""
        from contracts.models import Contract

        contracts = Contract.objects.all()
        summary_data = []

        for contract in contracts:
            slas = contract.sla_definitions.all()
            if not slas.exists():
                continue

            total_slas = slas.count()
            metrics = SLAMetric.objects.filter(sla_definition__in=slas)
            total_metrics = metrics.count()

            if total_metrics == 0:
                continue

            compliant = metrics.filter(
                response_sla_met=True, resolution_sla_met=True
            ).count()
            non_compliant = total_metrics - compliant
            compliance_rate = round((compliant / total_metrics * 100), 2)

            # Breakdown by priority
            by_priority = {}
            for priority_code, priority_name in SLADefinition.PRIORITY_CHOICES:
                priority_slas = slas.filter(priority=priority_code)
                if priority_slas.exists():
                    priority_metrics = SLAMetric.objects.filter(
                        sla_definition__in=priority_slas
                    )
                    if priority_metrics.exists():
                        priority_compliant = priority_metrics.filter(
                            response_sla_met=True, resolution_sla_met=True
                        ).count()
                        priority_total = priority_metrics.count()
                        by_priority[priority_code] = {
                            "total": priority_total,
                            "compliant": priority_compliant,
                            "rate": round(
                                (priority_compliant / priority_total * 100), 2
                            ),
                        }

            summary_data.append(
                {
                    "contract_id": contract.id,
                    "contract_name": contract.name,
                    "total_slas": total_slas,
                    "total_metrics": total_metrics,
                    "compliant_metrics": compliant,
                    "non_compliant_metrics": non_compliant,
                    "overall_compliance_rate": compliance_rate,
                    "by_priority": by_priority,
                }
            )

        serializer = ComplianceSummarySerializer(summary_data, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def metrics(self, request, pk=None):
        """Get all metrics for a specific SLA definition."""
        sla = self.get_object()
        metrics = sla.metrics.all()
        serializer = SLAMetricSerializer(metrics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_metric(self, request, pk=None):
        """Add a metric to this SLA definition.

        Accepts target_type ('task' or 'event') and target_id instead of
        raw content_type ID, resolving the ContentType internally.
        """
        from django.contrib.contenttypes.models import ContentType

        sla = self.get_object()
        target_type = request.data.get("target_type")
        target_id = request.data.get("target_id")
        actual_response = request.data.get("actual_response_time_minutes")
        actual_resolution = request.data.get("actual_resolution_time_minutes")

        if not all([target_type, target_id, actual_response, actual_resolution]):
            return Response(
                {
                    "error": "target_type, target_id, actual_response_time_minutes, actual_resolution_time_minutes are required"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        model_map = {
            "task": ("tasks", "task"),
            "event": ("events", "changeincident"),
        }

        if target_type not in model_map:
            return Response(
                {"error": "target_type must be 'task' or 'event'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        app_label, model_name = model_map[target_type]
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
        except ContentType.DoesNotExist:
            return Response(
                {"error": f"ContentType for {target_type} not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metric = SLAMetric(
            sla_definition=sla,
            content_type=ct,
            object_id=int(target_id),
            actual_response_time_minutes=int(actual_response),
            actual_resolution_time_minutes=int(actual_resolution),
        )
        metric.save()

        serializer = SLAMetricSerializer(metric)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SLAMetricViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA metrics with compliance filtering."""

    queryset = SLAMetric.objects.all()
    serializer_class = SLAMetricSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["sla_definition", "response_sla_met", "resolution_sla_met"]
    ordering_fields = ["created_at", "actual_response_time_minutes"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by SLA definition
        sla_id = self.request.query_params.get("sla_definition")
        if sla_id:
            queryset = queryset.filter(sla_definition_id=sla_id)

        # Filter by compliance status
        sla_met = self.request.query_params.get("sla_met")
        if sla_met is not None:
            is_met = sla_met.lower() == "true"
            queryset = queryset.filter(
                response_sla_met=is_met, resolution_sla_met=is_met
            )

        return queryset.select_related("sla_definition", "content_type")

    @action(detail=False, methods=["get"])
    def by_contract(self, request):
        """Get metrics grouped by contract."""
        from contracts.models import Contract

        contract_id = request.query_params.get("contract_id")
        if not contract_id:
            return Response(
                {"error": "contract_id parameter required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            contract = Contract.objects.get(id=contract_id)
        except Contract.DoesNotExist:
            return Response(
                {"error": "Contract not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        slas = contract.sla_definitions.all()
        metrics = SLAMetric.objects.filter(sla_definition__in=slas)

        serializer = SLAMetricSerializer(metrics, many=True)
        return Response(
            {
                "contract_id": contract.id,
                "contract_name": contract.name,
                "total_metrics": metrics.count(),
                "metrics": serializer.data,
            }
        )
