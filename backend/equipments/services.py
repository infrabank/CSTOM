"""Business logic for Equipment management."""

from typing import Any, Optional

from common.errors import ValidationError
from .authorization import (
    MovementAuthorizationService,
    MovementType,
)
from .models import Equipment, EquipmentTransaction


class EquipmentService:
    """Service class for Equipment operations."""

    @staticmethod
    def create(data: dict[str, Any]) -> Equipment:
        """Create a new equipment."""
        equipment = Equipment.objects.create(**data)
        return equipment

    @staticmethod
    def update(equipment: Equipment, data: dict[str, Any]) -> Equipment:
        """Update an existing equipment."""
        for key, value in data.items():
            setattr(equipment, key, value)
        equipment.save()
        return equipment

    @staticmethod
    def check_out(
        equipment: Equipment,
        approver,
        handler_name: str,
        handler_affiliation: str,
        handler_contact: str,
        rationale: str,
        expected_return_date=None,
        notes: str = "",
        operational_context_type: Optional[str] = None,
        operational_context_id: Optional[int] = None,
    ) -> EquipmentTransaction:
        if equipment.status != "available":
            raise ValidationError("Equipment is not available for check-out")

        auth_service = MovementAuthorizationService()

        auth_service.validate_handler_identification(
            handler_name, handler_affiliation, handler_contact
        )
        auth_service.validate_rationale(rationale)

        auth_result = auth_service.authorize(
            equipment, approver, MovementType.CHECK_OUT
        )

        transaction = EquipmentTransaction.objects.create(
            equipment=equipment,
            transaction_type="check_out",
            handler_name=handler_name,
            handler_affiliation=handler_affiliation,
            handler_contact=handler_contact,
            purpose=rationale,
            expected_return_date=expected_return_date,
            notes=notes,
            approver=approver,
            approver_role=auth_result.approver_role,
            contract_status_at_approval=auth_result.contract_status,
            requires_pm_approval=auth_result.requires_pm_approval,
            pm_approval_obtained=approver.is_pm(),
            operational_context_type=operational_context_type,
            operational_context_id=operational_context_id,
        )
        return transaction

    @staticmethod
    def check_in(
        equipment: Equipment,
        approver,
        handler_name: str,
        handler_affiliation: str,
        handler_contact: str,
        rationale: str,
        notes: str = "",
        operational_context_type: Optional[str] = None,
        operational_context_id: Optional[int] = None,
    ) -> EquipmentTransaction:
        if equipment.status != "checked_out":
            raise ValidationError("Equipment is not checked out")

        auth_service = MovementAuthorizationService()

        auth_service.validate_handler_identification(
            handler_name, handler_affiliation, handler_contact
        )
        auth_service.validate_rationale(rationale)

        auth_result = auth_service.authorize(equipment, approver, MovementType.CHECK_IN)

        transaction = EquipmentTransaction.objects.create(
            equipment=equipment,
            transaction_type="check_in",
            handler_name=handler_name,
            handler_affiliation=handler_affiliation,
            handler_contact=handler_contact,
            purpose=rationale,
            notes=notes,
            approver=approver,
            approver_role=auth_result.approver_role,
            contract_status_at_approval=auth_result.contract_status,
            requires_pm_approval=auth_result.requires_pm_approval,
            pm_approval_obtained=approver.is_pm(),
            operational_context_type=operational_context_type,
            operational_context_id=operational_context_id,
        )
        return transaction

    @staticmethod
    def get_transactions(equipment: Equipment):
        """Get all transactions for an equipment."""
        return equipment.transactions.all()

    @staticmethod
    def get_checked_out_equipments():
        """Get all currently checked out equipments."""
        return Equipment.objects.filter(status="checked_out")
