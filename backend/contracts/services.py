"""Contract business logic services."""

from django.db.models import QuerySet

from common.errors import BusinessLogicError, ResourceNotFoundError

from .models import Contract, ContractStatusHistory


class ContractService:
    """Service class for contract operations."""

    VALID_STATUS_TRANSITIONS = {
        "pre-handover": ["handover"],
        "handover": ["stabilization"],
        "stabilization": ["steady"],
        "steady": ["closed"],
        "closed": [],
    }

    @staticmethod
    def get_all() -> QuerySet[Contract]:
        """Get all contracts."""
        return Contract.objects.all()

    @staticmethod
    def get_by_id(contract_id: int) -> Contract:
        """Get a contract by ID."""
        try:
            return Contract.objects.get(pk=contract_id)
        except Contract.DoesNotExist:
            raise ResourceNotFoundError(f"Contract with id {contract_id} not found")

    @staticmethod
    def create(data: dict) -> Contract:
        """Create a new contract."""
        scope_list = data.pop("scope_list", None)
        contract = Contract.objects.create(**data)
        if scope_list:
            contract.set_scope_list(scope_list)
            contract.save()
        return contract

    @staticmethod
    def update(contract: Contract, data: dict) -> Contract:
        """Update a contract."""
        scope_list = data.pop("scope_list", None)

        for key, value in data.items():
            setattr(contract, key, value)

        if scope_list is not None:
            contract.set_scope_list(scope_list)

        contract.save()
        return contract

    @classmethod
    def update_status(
        cls, contract: Contract, new_status: str, notes: str = ""
    ) -> Contract:
        """Update contract status with validation."""
        current_status = contract.status
        valid_next = cls.VALID_STATUS_TRANSITIONS.get(current_status, [])

        if new_status not in valid_next:
            raise BusinessLogicError(
                f"Invalid status transition: {current_status} -> {new_status}. "
                f"Valid transitions: {', '.join(valid_next) if valid_next else 'none'}"
            )

        contract.update_status(new_status, notes)
        return contract

    @staticmethod
    def update_risk_flags(
        contract: Contract,
        pre_env: bool | None = None,
        prior_vendor: bool | None = None,
        docs_incomplete: bool | None = None,
    ) -> Contract:
        """Update risk flags."""
        if pre_env is not None:
            contract.risk_pre_env = pre_env
        if prior_vendor is not None:
            contract.risk_prior_vendor = prior_vendor
        if docs_incomplete is not None:
            contract.risk_docs_incomplete = docs_incomplete
        contract.save()
        return contract

    @staticmethod
    def get_status_history(contract: Contract) -> QuerySet[ContractStatusHistory]:
        """Get status history for a contract."""
        return contract.status_history.all()
