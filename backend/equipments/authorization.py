"""Equipment Movement Authorization - Task 007: PM Approval Constraint."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional

from common.errors import PermissionDeniedError, ValidationError


class ContractOperationalStatus(Enum):
    OPERATIONAL = "operational"
    NON_OPERATIONAL = "non_operational"


OPERATIONAL_CONTRACT_STATUSES = frozenset({"stabilization", "steady"})
NON_OPERATIONAL_CONTRACT_STATUSES = frozenset({"pre-handover", "handover", "closed"})


def classify_contract_status(status: str) -> ContractOperationalStatus:
    if status in OPERATIONAL_CONTRACT_STATUSES:
        return ContractOperationalStatus.OPERATIONAL
    elif status in NON_OPERATIONAL_CONTRACT_STATUSES:
        return ContractOperationalStatus.NON_OPERATIONAL
    else:
        raise ValidationError(f"Unknown contract status: {status}")


class MovementType(Enum):
    CHECK_OUT = "check_out"
    CHECK_IN = "check_in"


@dataclass(frozen=True)
class AuthorizationResult:
    authorized: bool
    requires_pm_approval: bool
    approver_role: str
    approver_id: int
    contract_status: str
    movement_type: str
    reason: str
    checked_at: datetime

    def __post_init__(self):
        if self.authorized and self.requires_pm_approval and self.approver_role != "pm":
            raise ValueError(
                "Authorization granted but PM approval was required "
                "and approver is not PM"
            )


@dataclass(frozen=True)
class MovementDecisionLog:
    approver_id: int
    approver_role: str
    rationale: str
    contract_status_at_approval: str
    movement_type: str
    requires_pm_approval: bool
    pm_approval_obtained: bool
    operational_context_type: Optional[str] = None
    operational_context_id: Optional[int] = None
    created_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            object.__setattr__(self, "created_at", datetime.now())

        if not self.rationale or not self.rationale.strip():
            raise ValidationError("Movement rationale is required and cannot be empty.")

        valid_roles = {"pm", "engineer", "admin"}
        if self.approver_role not in valid_roles:
            raise ValidationError(
                f"Invalid approver role: {self.approver_role}. "
                f"Must be one of: {', '.join(valid_roles)}"
            )


class AuthorizationDeniedError(PermissionDeniedError):
    default_detail = "Equipment movement authorization denied."
    default_code = "equipment_movement_unauthorized"

    def __init__(
        self,
        detail: Optional[str] = None,
        requires_pm: bool = False,
        approver_role: Optional[str] = None,
        contract_status: Optional[str] = None,
    ):
        super().__init__(detail or self.default_detail)
        self.requires_pm = requires_pm
        self.approver_role = approver_role
        self.contract_status = contract_status


class RationaleMissingError(ValidationError):
    default_detail = "Movement rationale is required."
    default_code = "rationale_missing"


class HandlerIdentificationError(ValidationError):
    default_detail = "Handler identification is incomplete."
    default_code = "handler_incomplete"


class MovementAuthorizationService:
    def requires_pm_approval(
        self,
        contract_status: str,
        movement_type: MovementType,
    ) -> bool:
        if movement_type == MovementType.CHECK_IN:
            return False

        status_classification = classify_contract_status(contract_status)
        return status_classification == ContractOperationalStatus.OPERATIONAL

    def check_authorization(
        self,
        equipment,
        user,
        movement_type: MovementType,
    ) -> AuthorizationResult:
        contract = equipment.contract
        contract_status = contract.status
        user_role = user.primary_role or "unknown"

        requires_pm = self.requires_pm_approval(contract_status, movement_type)

        # Determine if authorized
        if requires_pm:
            # PM approval required - check if user is PM
            authorized = user.is_pm()
            reason = (
                "PM approval granted"
                if authorized
                else f"PM approval required for {movement_type.value} on operational contract"
            )
        else:
            # Standard approval - any authenticated user with valid role
            authorized = user_role in {"pm", "engineer", "admin"}
            reason = (
                "Standard approval granted"
                if authorized
                else "Valid role required for equipment movement"
            )

        return AuthorizationResult(
            authorized=authorized,
            requires_pm_approval=requires_pm,
            approver_role=user_role,
            approver_id=user.id,
            contract_status=contract_status,
            movement_type=movement_type.value,
            reason=reason,
            checked_at=datetime.now(),
        )

    def authorize(
        self,
        equipment,
        user,
        movement_type: MovementType,
    ) -> AuthorizationResult:
        result = self.check_authorization(equipment, user, movement_type)

        if not result.authorized:
            raise AuthorizationDeniedError(
                detail=result.reason,
                requires_pm=result.requires_pm_approval,
                approver_role=result.approver_role,
                contract_status=result.contract_status,
            )

        return result

    def validate_handler_identification(
        self,
        handler_name: str,
        handler_affiliation: str,
        handler_contact: str,
    ) -> None:
        missing_fields = []

        if not handler_name or not handler_name.strip():
            missing_fields.append("handler_name")
        if not handler_affiliation or not handler_affiliation.strip():
            missing_fields.append("handler_affiliation")
        if not handler_contact or not handler_contact.strip():
            missing_fields.append("handler_contact")

        if missing_fields:
            raise HandlerIdentificationError(
                f"Handler identification incomplete. Missing: {', '.join(missing_fields)}"
            )

    def validate_rationale(self, rationale: str) -> None:
        if not rationale or not rationale.strip():
            raise RationaleMissingError("Movement rationale is required.")

    def create_decision_log(
        self,
        approver,
        equipment,
        movement_type: MovementType,
        rationale: str,
        operational_context_type: Optional[str] = None,
        operational_context_id: Optional[int] = None,
    ) -> MovementDecisionLog:
        self.validate_rationale(rationale)
        auth_result = self.authorize(equipment, approver, movement_type)

        if operational_context_type:
            valid_context_types = {"incident", "change", "task"}
            if operational_context_type not in valid_context_types:
                raise ValidationError(
                    f"Invalid operational context type: {operational_context_type}. "
                    f"Must be one of: {', '.join(valid_context_types)}"
                )

        return MovementDecisionLog(
            approver_id=approver.id,
            approver_role=auth_result.approver_role,
            rationale=rationale,
            contract_status_at_approval=auth_result.contract_status,
            movement_type=movement_type.value,
            requires_pm_approval=auth_result.requires_pm_approval,
            pm_approval_obtained=approver.is_pm(),
            operational_context_type=operational_context_type,
            operational_context_id=operational_context_id,
        )


def is_operational_contract(contract_status: str) -> bool:
    return contract_status in OPERATIONAL_CONTRACT_STATUSES


def get_required_approval_level(
    contract_status: str,
    movement_type: MovementType,
) -> str:
    service = MovementAuthorizationService()
    if service.requires_pm_approval(contract_status, movement_type):
        return "pm"
    return "standard"
