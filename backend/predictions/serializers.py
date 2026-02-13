"""Serializers for AI prediction module."""

from rest_framework import serializers

from .models import EquipmentMetric, PredictionModel


class PredictionModelSerializer(serializers.ModelSerializer):
    """Serializer for PredictionModel metadata."""

    model_type_display = serializers.CharField(
        source="get_model_type_display", read_only=True
    )

    class Meta:
        model = PredictionModel
        fields = [
            "id",
            "name",
            "description",
            "model_type",
            "model_type_display",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EquipmentMetricSerializer(serializers.ModelSerializer):
    """Serializer for EquipmentMetric records."""

    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    prediction_model_name = serializers.CharField(
        source="prediction_model.name", read_only=True, default=None
    )

    class Meta:
        model = EquipmentMetric
        fields = [
            "id",
            "equipment",
            "equipment_name",
            "metric_date",
            "failure_count",
            "mtbf_hours",
            "usage_hours",
            "risk_score",
            "prediction_model",
            "prediction_model_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AtRiskEquipmentSerializer(serializers.Serializer):
    """Serializer for at-risk equipment prediction results.

    Matches the frontend EquipmentPrediction interface.
    """

    id = serializers.IntegerField()
    name = serializers.CharField()
    serial_number = serializers.CharField()
    contract_name = serializers.CharField()
    risk_score = serializers.FloatField()
    failure_count = serializers.IntegerField()
    days_since_last_failure = serializers.IntegerField(allow_null=True)
    mtbf_days = serializers.FloatField(allow_null=True)
    age_days = serializers.IntegerField()
