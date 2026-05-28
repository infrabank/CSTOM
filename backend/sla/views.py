"""SLA API views."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Count, F, Q, Case, When, IntegerField, Sum, DecimalField

from common.pagination import StandardPagination

from .models import (
    SLADefinition,
    SLAMetric,
    SLACategory,
    SLAEvaluationItem,
    SLAEvaluationReport,
    SLAEvaluationScore,
    SLAEvaluationCriteria,
    SLAPenalty,
    UptimeRecord,
    PerformanceImprovement,
    SLARevisionRequest,
)
from .serializers import (
    SLADefinitionSerializer,
    SLADefinitionListSerializer,
    SLAMetricSerializer,
    ComplianceSummarySerializer,
    SLACategorySerializer,
    SLACategoryListSerializer,
    SLAEvaluationItemSerializer,
    SLAEvaluationReportSerializer,
    SLAEvaluationReportListSerializer,
    SLAEvaluationScoreSerializer,
    SLAEvaluationCriteriaSerializer,
    SLAPenaltySerializer,
    UptimeRecordSerializer,
    PerformanceImprovementSerializer,
    SLARevisionRequestSerializer,
)


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
        """Get compliance summary by contract.

        Optimized: uses 2 aggregate queries instead of N+1 per-contract loops.
        """
        # Query 1: SLA definition counts per contract
        sla_counts = dict(
            SLADefinition.objects.values_list("contract_id").annotate(
                count=Count("id")
            ).values_list("contract_id", "count")
        )

        # Query 2: metric totals grouped by contract + priority
        metrics_agg = (
            SLAMetric.objects.select_related("sla_definition")
            .values(
                contract_id=F("sla_definition__contract_id"),
                contract_name=F("sla_definition__contract__name"),
                priority=F("sla_definition__priority"),
            )
            .annotate(
                total=Count("id"),
                compliant=Count(
                    "id",
                    filter=Q(response_sla_met=True, resolution_sla_met=True),
                ),
            )
        )

        # Build response grouped by contract
        contract_data = {}
        for row in metrics_agg:
            cid = row["contract_id"]
            if cid not in contract_data:
                contract_data[cid] = {
                    "contract_id": cid,
                    "contract_name": row["contract_name"],
                    "total_slas": sla_counts.get(cid, 0),
                    "total_metrics": 0,
                    "compliant_metrics": 0,
                    "non_compliant_metrics": 0,
                    "overall_compliance_rate": 0.0,
                    "by_priority": {},
                }

            cd = contract_data[cid]
            cd["total_metrics"] += row["total"]
            cd["compliant_metrics"] += row["compliant"]

            priority = row["priority"]
            if row["total"] > 0:
                cd["by_priority"][priority] = {
                    "total": row["total"],
                    "compliant": row["compliant"],
                    "rate": round((row["compliant"] / row["total"] * 100), 2),
                }

        # Calculate overall rates
        summary_data = []
        for cd in contract_data.values():
            cd["non_compliant_metrics"] = cd["total_metrics"] - cd["compliant_metrics"]
            if cd["total_metrics"] > 0:
                cd["overall_compliance_rate"] = round(
                    (cd["compliant_metrics"] / cd["total_metrics"] * 100), 2
                )
            summary_data.append(cd)

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


class SLACategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA evaluation categories with filtering and prefetching."""

    queryset = SLACategory.objects.all()
    serializer_class = SLACategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["contract", "is_active"]
    search_fields = ["name", "code"]
    ordering = ["display_order"]

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by contract
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)

        return queryset.prefetch_related("items")

    @action(detail=False, methods=["get"], pagination_class=None)
    def tree(self, request):
        """Return all SLA categories with nested items and criteria, unpaginated.

        The criteria-overview page renders a fixed tree per category and would
        truncate rows under standard pagination.
        """
        queryset = self.get_queryset().prefetch_related(
            "items", "items__criteria"
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SLAEvaluationItemViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA evaluation items with filtering and category selection."""

    queryset = SLAEvaluationItem.objects.all()
    serializer_class = SLAEvaluationItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["category", "is_active", "measurement_cycle"]
    search_fields = ["name"]
    ordering = ["item_number"]

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by category
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        return queryset.select_related("category")


class SLAEvaluationReportViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA evaluation reports with scoring and finalization."""

    queryset = SLAEvaluationReport.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["contract", "grade", "is_finalized"]
    search_fields = ["contract__name", "evaluator_notes"]
    ordering = ["-evaluation_period_start"]

    def get_serializer_class(self):
        """Use list serializer for list action."""
        if self.action == "list":
            return SLAEvaluationReportListSerializer
        return SLAEvaluationReportSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by contract
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)

        return queryset.prefetch_related(
            "scores", "scores__evaluation_item", "penalties"
        )

    def update(self, request, *args, **kwargs):
        """Block updates to finalized reports."""
        report = self.get_object()
        if report.is_finalized:
            return Response(
                {"error": "확정된 평가 보고서는 수정할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Block partial updates to finalized reports."""
        report = self.get_object()
        if report.is_finalized:
            return Response(
                {"error": "확정된 평가 보고서는 수정할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Block deletion of finalized reports."""
        report = self.get_object()
        if report.is_finalized:
            return Response(
                {"error": "확정된 평가 보고서는 삭제할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def auto_evaluate(self, request):
        """Auto-calculate service levels for items with available data.

        Query params: contract, period_start, period_end
        Returns: {item_number: {service_level, notes, metric_value}} for automatable items.
        """
        from .evaluation_services import auto_evaluate

        contract_id = request.query_params.get("contract")
        period_start = request.query_params.get("period_start")
        period_end = request.query_params.get("period_end")

        if not all([contract_id, period_start, period_end]):
            return Response(
                {"error": "contract, period_start, period_end are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from contracts.models import Contract

        try:
            contract = Contract.objects.get(id=contract_id)
        except Contract.DoesNotExist:
            return Response(
                {"error": "Contract not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = auto_evaluate(contract, period_start, period_end)
        return Response(results)

    @action(detail=True, methods=["post"])
    def calculate_score(self, request, pk=None):
        """Calculate total score with adjustments for this report."""
        from .evaluation_services import calculate_adjustment_points, calculate_penalties

        report = self.get_object()
        with transaction.atomic():
            # 1. Sum item scores
            report.calculate_total_score()
            # 2. Calculate and apply adjustments
            adjustment, dup_count, imp_count = calculate_adjustment_points(report)
            report.adjustment_points = adjustment
            report.duplicate_incident_count = dup_count
            report.improvement_count = imp_count
            report.total_score += adjustment
            # 3. Save (triggers grade calculation)
            report.save()
            # 4. Generate penalties
            calculate_penalties(report)
        report.refresh_from_db()
        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def penalties(self, request, pk=None):
        """Get all penalties for this report."""
        report = self.get_object()
        penalties = report.penalties.all()
        serializer = SLAPenaltySerializer(penalties, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def uptime_summary(self, request, pk=None):
        """Get uptime summary by equipment category for this report's period."""
        from django.db.models import Avg

        report = self.get_object()
        records = UptimeRecord.objects.filter(
            contract=report.contract,
            period_start__gte=report.evaluation_period_start,
            period_end__lte=report.evaluation_period_end,
        ).select_related("equipment")

        summary = (
            records.values("equipment__category")
            .annotate(avg_uptime=Avg("uptime_percentage"))
            .order_by("equipment__category")
        )
        return Response(list(summary))

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        """Finalize this report (requires score to be calculated)."""
        report = self.get_object()

        if report.total_score is None:
            return Response(
                {"error": "점수를 먼저 산출하세요"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        report.is_finalized = True
        report.save()
        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def scores(self, request, pk=None):
        """Get all scores for this report."""
        report = self.get_object()
        scores = report.scores.all()
        serializer = SLAEvaluationScoreSerializer(scores, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_score(self, request, pk=None):
        """Add or update a single score for this report."""
        report = self.get_object()

        evaluation_item_id = request.data.get("evaluation_item")
        service_level = request.data.get("service_level")

        if not evaluation_item_id or service_level is None:
            return Response(
                {"error": "evaluation_item and service_level are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or update score
        score, created = SLAEvaluationScore.objects.update_or_create(
            report=report,
            evaluation_item_id=evaluation_item_id,
            defaults={
                "service_level": service_level,
                "system_name": request.data.get("system_name") or "",
                "occurrence_date": request.data.get("occurrence_date") or None,
                "notes": request.data.get("notes") or "",
            },
        )

        serializer = SLAEvaluationScoreSerializer(score)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def bulk_scores(self, request, pk=None):
        """Add or update multiple scores at once."""
        report = self.get_object()
        scores_data = request.data.get("scores", [])

        if not scores_data:
            return Response(
                {"error": "scores array is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            for score_data in scores_data:
                evaluation_item_id = score_data.get("evaluation_item")
                service_level = score_data.get("service_level")

                if not evaluation_item_id or service_level is None:
                    continue

                SLAEvaluationScore.objects.update_or_create(
                    report=report,
                    evaluation_item_id=evaluation_item_id,
                    defaults={
                        "service_level": service_level,
                        "system_name": score_data.get("system_name") or "",
                        "occurrence_date": score_data.get("occurrence_date") or None,
                        "notes": score_data.get("notes") or "",
                    },
                )

        # Return updated report
        report.refresh_from_db()
        serializer = self.get_serializer(report)
        return Response(serializer.data)


class SLAEvaluationScoreViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA evaluation scores with filtering and prefetching."""

    queryset = SLAEvaluationScore.objects.all()
    serializer_class = SLAEvaluationScoreSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["report", "evaluation_item", "service_level"]
    ordering = ["evaluation_item__item_number"]

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by report
        report_id = self.request.query_params.get("report")
        if report_id:
            queryset = queryset.filter(report_id=report_id)

        return queryset.select_related(
            "evaluation_item", "evaluation_item__category", "report"
        )


class SLAEvaluationCriteriaViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA evaluation criteria."""

    queryset = SLAEvaluationCriteria.objects.all()
    serializer_class = SLAEvaluationCriteriaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["evaluation_item", "service_level"]
    ordering = ["evaluation_item__item_number", "-service_level"]

    def get_queryset(self):
        queryset = super().get_queryset()
        evaluation_item_id = self.request.query_params.get("evaluation_item")
        if evaluation_item_id:
            queryset = queryset.filter(evaluation_item_id=evaluation_item_id)
        # Filter by contract (via item -> category -> contract)
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(
                evaluation_item__category__contract_id=contract_id
            )
        return queryset.select_related("evaluation_item")


class SLAPenaltyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for SLA penalties (read-only, auto-generated)."""

    queryset = SLAPenalty.objects.all()
    serializer_class = SLAPenaltySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["report", "penalty_type", "is_offset"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        report_id = self.request.query_params.get("report")
        if report_id:
            queryset = queryset.filter(report_id=report_id)
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(report__contract_id=contract_id)
        return queryset.select_related("report", "evaluation_item")

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Aggregate penalty totals so the UI can paginate the list independently."""
        queryset = self.get_queryset()
        aggregates = queryset.aggregate(
            total_penalty=Sum(
                Case(
                    When(is_offset=False, then=F("penalty_amount")),
                    default=0,
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            ),
            offset_amount=Sum(
                Case(
                    When(is_offset=True, then=F("penalty_amount")),
                    default=0,
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                )
            ),
        )
        total = aggregates["total_penalty"] or 0
        offset = aggregates["offset_amount"] or 0
        return Response(
            {
                "total_penalty": str(total),
                "offset_amount": str(offset),
                "net_penalty": str(total - offset),
            }
        )


class UptimeRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for uptime records with filtering."""

    queryset = UptimeRecord.objects.all()
    serializer_class = UptimeRecordSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["equipment", "contract"]
    ordering = ["-period_start"]

    def get_queryset(self):
        queryset = super().get_queryset()
        equipment_id = self.request.query_params.get("equipment")
        if equipment_id:
            queryset = queryset.filter(equipment_id=equipment_id)
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        # Filter by period
        period_start = self.request.query_params.get("period_start")
        if period_start:
            queryset = queryset.filter(period_start__gte=period_start)
        period_end = self.request.query_params.get("period_end")
        if period_end:
            queryset = queryset.filter(period_end__lte=period_end)
        # Filter by equipment category
        category = self.request.query_params.get("equipment_category")
        if category:
            queryset = queryset.filter(equipment__category=category)
        return queryset.select_related("equipment", "contract")


class PerformanceImprovementViewSet(viewsets.ModelViewSet):
    """ViewSet for performance improvement proposals."""

    queryset = PerformanceImprovement.objects.all()
    serializer_class = PerformanceImprovementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["contract", "is_accepted"]
    search_fields = ["title", "description", "proposed_by"]
    ordering = ["-proposed_date"]

    def get_queryset(self):
        queryset = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        period_start = self.request.query_params.get("period_start")
        if period_start:
            queryset = queryset.filter(evaluation_period_start__gte=period_start)
        period_end = self.request.query_params.get("period_end")
        if period_end:
            queryset = queryset.filter(evaluation_period_end__lte=period_end)
        return queryset.select_related("contract")


class SLARevisionRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA revision requests."""

    queryset = SLARevisionRequest.objects.all()
    serializer_class = SLARevisionRequestSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filterset_fields = ["contract", "review_result"]
    search_fields = ["revision_reason", "requester_name", "document_name"]
    ordering = ["-request_date"]

    def get_queryset(self):
        queryset = super().get_queryset()
        contract_id = self.request.query_params.get("contract")
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        review_result = self.request.query_params.get("status")
        if review_result:
            queryset = queryset.filter(review_result=review_result)
        return queryset.select_related("contract")
