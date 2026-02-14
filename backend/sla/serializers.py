"""SLA serializers for REST API."""

from rest_framework import serializers
from django.db.models import Q, Count, Case, When, IntegerField

from .models import (
    SLADefinition,
    SLAMetric,
    SLACategory,
    SLAEvaluationItem,
    SLAEvaluationReport,
    SLAEvaluationScore,
)
from contracts.models import Contract


class SLAMetricSerializer(serializers.ModelSerializer):
    """Serializer for SLA metrics with compliance details."""

    content_type_name = serializers.SerializerMethodField()
    object_display = serializers.SerializerMethodField()

    class Meta:
        model = SLAMetric
        fields = [
            "id",
            "sla_definition",
            "content_type",
            "content_type_name",
            "object_id",
            "object_display",
            "actual_response_time_minutes",
            "actual_resolution_time_minutes",
            "response_sla_met",
            "resolution_sla_met",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "response_sla_met",
            "resolution_sla_met",
            "created_at",
            "updated_at",
        ]

    def get_content_type_name(self, obj):
        """Return the content type name."""
        return obj.content_type.model if obj.content_type else None

    def get_object_display(self, obj):
        """Return string representation of the related object."""
        return str(obj.content_object) if obj.content_object else None


class SLADefinitionSerializer(serializers.ModelSerializer):
    """Serializer for SLA definitions."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    metrics = SLAMetricSerializer(many=True, read_only=True)
    compliance_rate = serializers.SerializerMethodField()

    class Meta:
        model = SLADefinition
        fields = [
            "id",
            "contract",
            "contract_name",
            "service_type",
            "priority",
            "target_response_time_minutes",
            "target_resolution_time_minutes",
            "description",
            "is_active",
            "metrics",
            "compliance_rate",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_compliance_rate(self, obj):
        """Calculate compliance rate for this SLA definition."""
        metrics = obj.metrics.all()
        if not metrics.exists():
            return None

        # Count metrics where both response and resolution SLAs are met
        compliant = metrics.filter(
            response_sla_met=True, resolution_sla_met=True
        ).count()
        total = metrics.count()

        return round((compliant / total * 100), 2) if total > 0 else None


class SLADefinitionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for SLA definition lists."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    metric_count = serializers.SerializerMethodField()
    compliance_rate = serializers.SerializerMethodField()

    class Meta:
        model = SLADefinition
        fields = [
            "id",
            "contract",
            "contract_name",
            "service_type",
            "priority",
            "target_response_time_minutes",
            "target_resolution_time_minutes",
            "is_active",
            "metric_count",
            "compliance_rate",
            "created_at",
        ]

    def get_metric_count(self, obj):
        """Return count of metrics for this SLA."""
        return obj.metrics.count()

    def get_compliance_rate(self, obj):
        """Calculate compliance rate for this SLA definition."""
        metrics = obj.metrics.all()
        if not metrics.exists():
            return None

        compliant = metrics.filter(
            response_sla_met=True, resolution_sla_met=True
        ).count()
        total = metrics.count()

        return round((compliant / total * 100), 2) if total > 0 else None


class ComplianceSummarySerializer(serializers.Serializer):
    """Serializer for compliance summary by contract."""

    contract_id = serializers.IntegerField()
    contract_name = serializers.CharField()
    total_slas = serializers.IntegerField()
    total_metrics = serializers.IntegerField()
    compliant_metrics = serializers.IntegerField()
    non_compliant_metrics = serializers.IntegerField()
    overall_compliance_rate = serializers.FloatField()
    by_priority = serializers.DictField()


class SLAEvaluationItemSerializer(serializers.ModelSerializer):
    """Serializer for SLA evaluation items."""

    category_name = serializers.SerializerMethodField()

    class Meta:
        model = SLAEvaluationItem
        fields = [
            "id",
            "category",
            "item_number",
            "name",
            "weight",
            "measurement_cycle",
            "description",
            "is_active",
            "category_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_category_name(self, obj):
        """Return the category name."""
        return obj.category.name


class SLACategorySerializer(serializers.ModelSerializer):
    """Serializer for SLA categories with nested items."""

    items = SLAEvaluationItemSerializer(many=True, read_only=True)

    class Meta:
        model = SLACategory
        fields = [
            "id",
            "name",
            "code",
            "weight_percent",
            "contract",
            "display_order",
            "is_active",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SLACategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for SLA category lists."""

    item_count = serializers.SerializerMethodField()

    class Meta:
        model = SLACategory
        fields = [
            "id",
            "name",
            "code",
            "weight_percent",
            "contract",
            "display_order",
            "is_active",
            "item_count",
        ]

    def get_item_count(self, obj):
        """Return count of items in this category."""
        return obj.items.count()


class SLAEvaluationScoreSerializer(serializers.ModelSerializer):
    """Serializer for SLA evaluation scores."""

    item_name = serializers.SerializerMethodField()
    item_weight = serializers.SerializerMethodField()
    item_number = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = SLAEvaluationScore
        fields = [
            "id",
            "report",
            "evaluation_item",
            "service_level",
            "score",
            "system_name",
            "occurrence_date",
            "notes",
            "item_name",
            "item_weight",
            "item_number",
            "category_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "score", "created_at", "updated_at"]

    def get_item_name(self, obj):
        """Return the evaluation item name."""
        return obj.evaluation_item.name

    def get_item_weight(self, obj):
        """Return the evaluation item weight."""
        return obj.evaluation_item.weight

    def get_item_number(self, obj):
        """Return the evaluation item number."""
        return obj.evaluation_item.item_number

    def get_category_name(self, obj):
        """Return the category name."""
        return obj.evaluation_item.category.name


class SLAEvaluationReportSerializer(serializers.ModelSerializer):
    """Serializer for SLA evaluation reports with nested scores."""

    contract_name = serializers.SerializerMethodField(read_only=True)
    grade_display = serializers.SerializerMethodField()
    scores = SLAEvaluationScoreSerializer(many=True, read_only=True)

    class Meta:
        model = SLAEvaluationReport
        fields = [
            "id",
            "contract",
            "contract_name",
            "evaluation_period_start",
            "evaluation_period_end",
            "total_score",
            "grade",
            "grade_display",
            "evaluator_notes",
            "deduction_notes",
            "is_finalized",
            "scores",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "total_score", "grade", "created_at", "updated_at"]

    def get_contract_name(self, obj):
        """Return the contract name."""
        return obj.contract.name

    def get_grade_display(self, obj):
        """Return the human-readable grade."""
        return obj.get_grade_display()


class SLAEvaluationReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for SLA evaluation report lists."""

    contract_name = serializers.SerializerMethodField()
    grade_display = serializers.SerializerMethodField()

    class Meta:
        model = SLAEvaluationReport
        fields = [
            "id",
            "contract",
            "contract_name",
            "evaluation_period_start",
            "evaluation_period_end",
            "total_score",
            "grade",
            "grade_display",
            "is_finalized",
            "created_at",
        ]

    def get_contract_name(self, obj):
        """Return the contract name."""
        return obj.contract.name

    def get_grade_display(self, obj):
        """Return the human-readable grade."""
        return obj.get_grade_display()
