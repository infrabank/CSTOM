"""ChangeIncident serializers."""

from rest_framework import serializers

from .models import ChangeIncident


class ChangeIncidentSerializer(serializers.ModelSerializer):
    """Serializer for ChangeIncident model."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    related_event_title = serializers.CharField(
        source="related_event.title", read_only=True, allow_null=True
    )

    class Meta:
        model = ChangeIncident
        fields = [
            "id",
            "contract",
            "contract_name",
            "record_type",
            "title",
            "description",
            "occurred_at",
            "detected_at",
            "resolved_at",
            "customer_notified",
            "customer_notified_at",
            "related_event",
            "related_event_title",
            "summary_notice",
            "audit_summary",
            "created_at",
        ]
        read_only_fields = ["id", "summary_notice", "audit_summary", "created_at"]


class ChangeIncidentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event lists."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    has_related = serializers.SerializerMethodField()

    class Meta:
        model = ChangeIncident
        fields = [
            "id",
            "contract",
            "contract_name",
            "record_type",
            "title",
            "occurred_at",
            "resolved_at",
            "customer_notified",
            "has_related",
            "created_at",
        ]

    def get_has_related(self, obj) -> bool:
        return obj.related_event_id is not None


class ChangeIncidentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating events."""

    class Meta:
        model = ChangeIncident
        fields = [
            "contract",
            "record_type",
            "title",
            "description",
            "occurred_at",
            "detected_at",
            "resolved_at",
            "customer_notified",
            "customer_notified_at",
        ]


class LinkEventSerializer(serializers.Serializer):
    """Serializer for linking events."""

    related_event = serializers.IntegerField()
