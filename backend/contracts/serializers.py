"""Contract serializers."""

from rest_framework import serializers

from .models import Contract, ContractStatusHistory


class ContractStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for contract status history."""

    class Meta:
        model = ContractStatusHistory
        fields = ["id", "old_status", "new_status", "notes", "changed_at"]
        read_only_fields = ["id", "changed_at"]


class ContractSerializer(serializers.ModelSerializer):
    """Serializer for Contract model."""

    scope_list = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
    )
    scopes = serializers.SerializerMethodField(read_only=True)
    risk_flags = serializers.SerializerMethodField(read_only=True)
    status_history = ContractStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = [
            "id",
            "name",
            "client_org",
            "start_date",
            "end_date",
            "contract_amount",
            "scope_flags",
            "scope_list",
            "scopes",
            "status",
            "risk_pre_env",
            "risk_prior_vendor",
            "risk_docs_incomplete",
            "risk_flags",
            "status_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_scopes(self, obj) -> list[str]:
        return obj.get_scope_list()

    def get_risk_flags(self, obj) -> dict:
        return obj.get_risk_flags()

    def create(self, validated_data):
        scope_list = validated_data.pop("scope_list", None)
        contract = Contract.objects.create(**validated_data)
        if scope_list:
            contract.set_scope_list(scope_list)
            contract.save()
        return contract

    def update(self, instance, validated_data):
        scope_list = validated_data.pop("scope_list", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if scope_list is not None:
            instance.set_scope_list(scope_list)

        instance.save()
        return instance


class ContractListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for contract lists."""

    scopes = serializers.SerializerMethodField()
    risk_flags = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "id",
            "name",
            "client_org",
            "start_date",
            "end_date",
            "status",
            "scopes",
            "risk_flags",
            "created_at",
        ]

    def get_scopes(self, obj) -> list[str]:
        return obj.get_scope_list()

    def get_risk_flags(self, obj) -> dict:
        return obj.get_risk_flags()


class ContractStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating contract status."""

    status = serializers.ChoiceField(choices=Contract.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
