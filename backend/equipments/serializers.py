"""Serializers for Equipment and EquipmentTransaction."""

from rest_framework import serializers
from .models import Equipment, EquipmentTransaction


class EquipmentTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    approver_name = serializers.CharField(source="approver.__str__", read_only=True)
    operational_context_type_display = serializers.CharField(
        source="get_operational_context_type_display", read_only=True
    )

    class Meta:
        model = EquipmentTransaction
        fields = [
            "id",
            "equipment",
            "transaction_type",
            "transaction_type_display",
            "handler_name",
            "handler_affiliation",
            "handler_contact",
            "purpose",
            "expected_return_date",
            "transaction_date",
            "notes",
            "approver",
            "approver_name",
            "approver_role",
            "contract_status_at_approval",
            "requires_pm_approval",
            "pm_approval_obtained",
            "operational_context_type",
            "operational_context_type_display",
            "operational_context_id",
        ]
        read_only_fields = [
            "id",
            "transaction_date",
            "approver",
            "approver_role",
            "contract_status_at_approval",
            "requires_pm_approval",
            "pm_approval_obtained",
        ]


class CheckOutSerializer(serializers.Serializer):
    handler_name = serializers.CharField(max_length=100)
    handler_affiliation = serializers.CharField(max_length=255)
    handler_contact = serializers.CharField(max_length=100)
    rationale = serializers.CharField()
    expected_return_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    operational_context_type = serializers.ChoiceField(
        choices=["incident", "change", "task"],
        required=False,
        allow_null=True,
    )
    operational_context_id = serializers.IntegerField(required=False, allow_null=True)


class CheckInSerializer(serializers.Serializer):
    handler_name = serializers.CharField(max_length=100)
    handler_affiliation = serializers.CharField(max_length=255)
    handler_contact = serializers.CharField(max_length=100)
    rationale = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    operational_context_type = serializers.ChoiceField(
        choices=["incident", "change", "task"],
        required=False,
        allow_null=True,
    )
    operational_context_id = serializers.IntegerField(required=False, allow_null=True)


class EquipmentTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentTransaction
        fields = [
            "transaction_type",
            "handler_name",
            "handler_affiliation",
            "handler_contact",
            "purpose",
            "expected_return_date",
            "notes",
        ]


class EquipmentSerializer(serializers.ModelSerializer):
    """Full serializer for Equipment with transactions."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            "id",
            "contract",
            "contract_name",
            "name",
            "category",
            "category_display",
            "serial_number",
            "model_name",
            "manufacturer",
            "location",
            "status",
            "status_display",
            "notes",
            "created_at",
            "updated_at",
            "recent_transactions",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_recent_transactions(self, obj):
        """Get 5 most recent transactions."""
        transactions = obj.transactions.all()[:5]
        return EquipmentTransactionSerializer(transactions, many=True).data


class EquipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Equipment list."""

    contract_name = serializers.CharField(source="contract.name", read_only=True)
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    last_transaction = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            "id",
            "contract",
            "contract_name",
            "name",
            "category",
            "category_display",
            "serial_number",
            "model_name",
            "status",
            "status_display",
            "location",
            "last_transaction",
            "created_at",
        ]

    def get_last_transaction(self, obj):
        """Get the most recent transaction."""
        transaction = obj.transactions.first()
        if transaction:
            return {
                "type": transaction.transaction_type,
                "type_display": transaction.get_transaction_type_display(),
                "handler_name": transaction.handler_name,
                "date": transaction.transaction_date,
            }
        return None


class EquipmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Equipment."""

    class Meta:
        model = Equipment
        fields = [
            "contract",
            "name",
            "category",
            "serial_number",
            "model_name",
            "manufacturer",
            "location",
            "notes",
        ]
