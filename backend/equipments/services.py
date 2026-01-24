"""Business logic for Equipment management."""

from dataclasses import dataclass
from datetime import date
from typing import Any, Optional

from django.db.models import Count, Q

from common.errors import ValidationError
from .authorization import (
    MovementAuthorizationService,
    MovementType,
)
from .models import Equipment, EquipmentCorrection, EquipmentTransaction


def validate_operational_context(
    context_type: Optional[str],
    context_id: Optional[int],
) -> None:
    """Validate that operational context references an existing record (Task 006)."""
    if not context_type or not context_id:
        return

    if context_type == "incident":
        from events.models import ChangeIncident

        if not ChangeIncident.objects.filter(id=context_id).exists():
            raise ValidationError(
                f"Referenced incident (ID: {context_id}) does not exist."
            )
    elif context_type == "change":
        from events.models import ChangeIncident

        if not ChangeIncident.objects.filter(
            id=context_id, record_type="change"
        ).exists():
            raise ValidationError(
                f"Referenced change event (ID: {context_id}) does not exist or is not a change type."
            )
    elif context_type == "task":
        from tasks.models import Task

        if not Task.objects.filter(id=context_id).exists():
            raise ValidationError(f"Referenced task (ID: {context_id}) does not exist.")


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

        # Task 006: Validate operational context references existing records
        validate_operational_context(operational_context_type, operational_context_id)

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

        # Task 006: Validate operational context references existing records
        validate_operational_context(operational_context_type, operational_context_id)

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


@dataclass
class CustodyHistoryFilters:
    """Filters for custody history query."""

    date_from: Optional[date] = None
    date_to: Optional[date] = None
    transaction_type: Optional[str] = None
    approver_role: Optional[str] = None
    order: str = "asc"


@dataclass
class CustodyHistoryResult:
    """Result of custody history query."""

    equipment: Equipment
    transactions: list
    current_status: str
    total_count: int


class CustodyHistoryService:
    """Service for Task 009: Equipment Custody History Query."""

    @staticmethod
    def get_custody_history(
        equipment: Equipment, filters: CustodyHistoryFilters
    ) -> CustodyHistoryResult:
        """Get custody history for an equipment with filters."""
        queryset = EquipmentTransaction.objects.filter(equipment=equipment)

        if filters.date_from:
            queryset = queryset.filter(transaction_date__date__gte=filters.date_from)

        if filters.date_to:
            queryset = queryset.filter(transaction_date__date__lte=filters.date_to)

        if filters.transaction_type:
            queryset = queryset.filter(transaction_type=filters.transaction_type)

        if filters.approver_role:
            queryset = queryset.filter(approver_role=filters.approver_role)

        if filters.order == "asc":
            queryset = queryset.order_by("transaction_date")
        else:
            queryset = queryset.order_by("-transaction_date")

        transactions = list(queryset)

        return CustodyHistoryResult(
            equipment=equipment,
            transactions=transactions,
            current_status=equipment.status,
            total_count=len(transactions),
        )


@dataclass
class ContractEquipmentFilters:
    """Filters for contract equipment movements query."""

    date_from: Optional[date] = None
    date_to: Optional[date] = None
    equipment_status: Optional[str] = None
    include_retired: bool = False
    authorization_filter: Optional[str] = None


@dataclass
class EquipmentMovementSummary:
    """Summary of movements for a single equipment."""

    equipment_id: int
    equipment_name: str
    serial_number: str
    category: str
    current_status: str
    total_movements: int
    last_movement: Optional[dict]


@dataclass
class ContractEquipmentMovementsResult:
    """Result of contract equipment movements query."""

    contract_id: int
    contract_name: str
    equipment_summaries: list[EquipmentMovementSummary]
    total_equipment_count: int
    checked_out_count: int
    total_movements_in_period: int
    pm_approved_count: int
    standard_approved_count: int
    movements_requiring_pm: int
    movements_with_pm_approval: int
    compliance_rate: float


class ContractEquipmentMovementsService:
    """Service for Task 010: Contract Equipment Movements Query."""

    @staticmethod
    def get_contract_equipment_movements(
        contract, filters: ContractEquipmentFilters
    ) -> ContractEquipmentMovementsResult:
        """Get equipment movements for a contract with aggregation."""
        equipment_qs = Equipment.objects.filter(contract=contract)

        if not filters.include_retired:
            equipment_qs = equipment_qs.exclude(status="retired")

        if filters.equipment_status:
            equipment_qs = equipment_qs.filter(status=filters.equipment_status)

        equipment_list = list(equipment_qs)
        equipment_ids = [e.id for e in equipment_list]

        movement_qs = EquipmentTransaction.objects.filter(
            equipment_id__in=equipment_ids
        )

        if filters.date_from:
            movement_qs = movement_qs.filter(
                transaction_date__date__gte=filters.date_from
            )

        if filters.date_to:
            movement_qs = movement_qs.filter(
                transaction_date__date__lte=filters.date_to
            )

        if filters.authorization_filter == "pm_approved":
            movement_qs = movement_qs.filter(pm_approval_obtained=True)
        elif filters.authorization_filter == "standard":
            movement_qs = movement_qs.filter(pm_approval_obtained=False)

        all_movements = list(movement_qs)

        equipment_movement_counts = {}
        equipment_last_movement = {}
        for movement in all_movements:
            eq_id = movement.equipment_id
            equipment_movement_counts[eq_id] = (
                equipment_movement_counts.get(eq_id, 0) + 1
            )
            if eq_id not in equipment_last_movement:
                equipment_last_movement[eq_id] = movement

        equipment_summaries = []
        for equipment in equipment_list:
            last_mov = equipment_last_movement.get(equipment.id)
            last_movement_data = None
            if last_mov:
                last_movement_data = {
                    "id": last_mov.id,
                    "transaction_type": last_mov.transaction_type,
                    "handler_name": last_mov.handler_name,
                    "transaction_date": last_mov.transaction_date,
                    "approver_role": last_mov.approver_role,
                }

            equipment_summaries.append(
                EquipmentMovementSummary(
                    equipment_id=equipment.id,
                    equipment_name=equipment.name,
                    serial_number=equipment.serial_number,
                    category=equipment.category,
                    current_status=equipment.status,
                    total_movements=equipment_movement_counts.get(equipment.id, 0),
                    last_movement=last_movement_data,
                )
            )

        checked_out_count = sum(1 for e in equipment_list if e.status == "checked_out")

        pm_approved_count = sum(1 for m in all_movements if m.pm_approval_obtained)
        standard_approved_count = len(all_movements) - pm_approved_count

        movements_requiring_pm = sum(1 for m in all_movements if m.requires_pm_approval)
        movements_with_pm_approval = sum(
            1
            for m in all_movements
            if m.requires_pm_approval and m.pm_approval_obtained
        )

        compliance_rate = (
            (movements_with_pm_approval / movements_requiring_pm * 100)
            if movements_requiring_pm > 0
            else 100.0
        )

        return ContractEquipmentMovementsResult(
            contract_id=contract.id,
            contract_name=contract.name,
            equipment_summaries=equipment_summaries,
            total_equipment_count=len(equipment_list),
            checked_out_count=checked_out_count,
            total_movements_in_period=len(all_movements),
            pm_approved_count=pm_approved_count,
            standard_approved_count=standard_approved_count,
            movements_requiring_pm=movements_requiring_pm,
            movements_with_pm_approval=movements_with_pm_approval,
            compliance_rate=round(compliance_rate, 2),
        )


class EquipmentCorrectionService:
    """Service for Task 008: Compensating entries for corrections."""

    @staticmethod
    def create_correction(
        equipment: Equipment,
        corrected_by,
        correction_type: str,
        description: str,
        original_transaction: Optional[EquipmentTransaction] = None,
        new_status: Optional[str] = None,
    ) -> EquipmentCorrection:
        """Create a compensating entry to correct equipment data.

        Args:
            equipment: The equipment being corrected
            corrected_by: User making the correction
            correction_type: Type of correction (equipment_data, transaction_void, status_override, other)
            description: Detailed explanation of what was wrong and what is being corrected
            original_transaction: The transaction being voided/corrected (optional)
            new_status: New status for status_override corrections (optional)

        Returns:
            The created EquipmentCorrection record
        """
        if correction_type == "status_override" and not new_status:
            raise ValidationError(
                "new_status is required for status_override corrections"
            )

        if correction_type == "transaction_void" and not original_transaction:
            raise ValidationError(
                "original_transaction is required for transaction_void corrections"
            )

        correction = EquipmentCorrection.objects.create(
            equipment=equipment,
            original_transaction=original_transaction,
            correction_type=correction_type,
            description=description,
            corrected_by=corrected_by,
            new_status=new_status or "",
        )

        return correction

    @staticmethod
    def get_corrections(equipment: Equipment):
        """Get all corrections for an equipment."""
        return equipment.corrections.all()

    @staticmethod
    def void_transaction(
        transaction: EquipmentTransaction,
        corrected_by,
        reason: str,
    ) -> EquipmentCorrection:
        """Create a void entry for a transaction that was recorded in error.

        Note: This does NOT delete the transaction (immutable), but creates
        a compensating record that documents the void.
        """
        return EquipmentCorrectionService.create_correction(
            equipment=transaction.equipment,
            corrected_by=corrected_by,
            correction_type="transaction_void",
            description=f"VOID: {reason}",
            original_transaction=transaction,
        )
