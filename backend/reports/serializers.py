"""Report serializers."""

from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "contract",
            "contract_name",
            "report_type",
            "period_start",
            "period_end",
            "generated_at",
            "summary",
            "integrity_hash",
        ]
        read_only_fields = ["id", "generated_at", "summary", "integrity_hash"]


class ReportListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for report lists."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "contract",
            "contract_name",
            "report_type",
            "period_start",
            "period_end",
            "generated_at",
        ]


class ReportGenerateSerializer(serializers.Serializer):
    """Serializer for generating reports."""

    contract = serializers.IntegerField()
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPES)
    period_start = serializers.DateField()
    period_end = serializers.DateField()

    def validate(self, data):
        if data["period_start"] > data["period_end"]:
            raise serializers.ValidationError("period_start must be before period_end")
        return data
