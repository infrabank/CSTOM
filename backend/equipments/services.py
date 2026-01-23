"""Business logic for Equipment management."""

from typing import Any
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
        handler_name: str,
        handler_affiliation: str = "",
        handler_contact: str = "",
        purpose: str = "",
        expected_return_date=None,
        notes: str = "",
    ) -> EquipmentTransaction:
        """Check out equipment."""
        if equipment.status != "available":
            raise ValueError("Equipment is not available for check-out")

        transaction = EquipmentTransaction.objects.create(
            equipment=equipment,
            transaction_type="check_out",
            handler_name=handler_name,
            handler_affiliation=handler_affiliation,
            handler_contact=handler_contact,
            purpose=purpose,
            expected_return_date=expected_return_date,
            notes=notes,
        )
        return transaction

    @staticmethod
    def check_in(
        equipment: Equipment,
        handler_name: str,
        handler_affiliation: str = "",
        handler_contact: str = "",
        notes: str = "",
    ) -> EquipmentTransaction:
        """Check in equipment."""
        if equipment.status != "checked_out":
            raise ValueError("Equipment is not checked out")

        transaction = EquipmentTransaction.objects.create(
            equipment=equipment,
            transaction_type="check_in",
            handler_name=handler_name,
            handler_affiliation=handler_affiliation,
            handler_contact=handler_contact,
            notes=notes,
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
