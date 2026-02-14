"""AI prediction API views."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action

from common.pagination import StandardPagination

from .models import EquipmentMetric, PredictionModel
from .serializers import (
    AtRiskEquipmentSerializer,
    EquipmentMetricSerializer,
    PredictionModelSerializer,
)
from .services import PredictionService


class AtRiskEquipmentView(APIView):
    """List equipment ranked by failure risk score.

    GET /api/v1/predictions/at-risk/
    Query params:
        min_score: minimum risk score threshold (default: 0)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        min_score = float(request.query_params.get("min_score", 0))
        results = PredictionService.get_at_risk_equipment(min_risk_score=min_score)
        serializer = AtRiskEquipmentSerializer(results, many=True)
        return Response({"results": serializer.data})


class PredictionModelViewSet(ModelViewSet):
    """CRUD for PredictionModel configuration."""

    queryset = PredictionModel.objects.all()
    serializer_class = PredictionModelSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class EquipmentMetricViewSet(ModelViewSet):
    """CRUD for EquipmentMetric records."""

    queryset = EquipmentMetric.objects.select_related(
        "equipment", "prediction_model"
    ).all()
    serializer_class = EquipmentMetricSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        """Allow filtering by equipment_id."""
        qs = super().get_queryset()
        equipment_id = self.request.query_params.get("equipment_id")
        if equipment_id:
            qs = qs.filter(equipment_id=equipment_id)
        return qs

    @action(detail=False, methods=["post"], url_path="recalculate")
    def recalculate(self, request):
        """Recalculate metrics for a specific equipment or all.

        POST /api/v1/predictions/metrics/recalculate/
        Body: { "equipment_id": 123 }  (optional, omit for all)
        """
        from equipments.models import Equipment

        equipment_id = request.data.get("equipment_id")
        if equipment_id:
            try:
                equipment = Equipment.objects.get(pk=equipment_id)
            except Equipment.DoesNotExist:
                return Response(
                    {"error": f"Equipment {equipment_id} not found"}, status=404
                )
            metric = PredictionService.recalculate_metrics(equipment)
            return Response(EquipmentMetricSerializer(metric).data)

        # Recalculate all non-retired equipment
        equipments = Equipment.objects.exclude(status="retired")
        count = 0
        for eq in equipments:
            PredictionService.recalculate_metrics(eq)
            count += 1
        return Response({"recalculated": count})
