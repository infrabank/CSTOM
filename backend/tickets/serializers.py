"""Ticket system serializers."""

from rest_framework import serializers

from .models import Ticket, TicketComment, TicketStatusHistory


class TicketStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for TicketStatusHistory model."""

    changed_by_name = serializers.CharField(
        source="changed_by.get_full_name", read_only=True
    )

    class Meta:
        model = TicketStatusHistory
        fields = [
            "id",
            "ticket",
            "old_status",
            "new_status",
            "changed_by",
            "changed_by_name",
            "changed_at",
        ]
        read_only_fields = ["id", "ticket", "changed_by", "changed_at"]


class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer for TicketComment model."""

    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = TicketComment
        fields = [
            "id",
            "ticket",
            "author",
            "author_name",
            "content",
            "is_internal",
            "created_at",
        ]
        read_only_fields = ["id", "ticket", "author", "created_at"]


class TicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for ticket lists."""

    requester_name = serializers.CharField(
        source="requester.get_full_name", read_only=True
    )
    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    contract_name = serializers.CharField(source="contract.name", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "priority",
            "status",
            "requester",
            "requester_name",
            "assigned_to",
            "assigned_to_name",
            "contract",
            "contract_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requester",
            "created_at",
            "updated_at",
        ]


class TicketDetailSerializer(serializers.ModelSerializer):
    """Full serializer for ticket detail."""

    requester_name = serializers.CharField(
        source="requester.get_full_name", read_only=True
    )
    assigned_to_name = serializers.CharField(
        source="assigned_to.get_full_name", read_only=True
    )
    contract_name = serializers.CharField(source="contract.name", read_only=True)
    sla_definition_name = serializers.CharField(
        source="sla_definition.name", read_only=True
    )
    comments = TicketCommentSerializer(many=True, read_only=True)
    status_history = TicketStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "status",
            "requester",
            "requester_name",
            "assigned_to",
            "assigned_to_name",
            "contract",
            "contract_name",
            "sla_definition",
            "sla_definition_name",
            "comments",
            "status_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requester",
            "comments",
            "status_history",
            "created_at",
            "updated_at",
        ]


class TicketCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tickets."""

    class Meta:
        model = Ticket
        fields = [
            "title",
            "description",
            "priority",
            "status",
            "assigned_to",
            "contract",
            "sla_definition",
        ]
