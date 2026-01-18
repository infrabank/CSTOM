"""ChangeIncident business logic services."""

from django.db.models import QuerySet

from common.errors import BusinessLogicError, ResourceNotFoundError
from contracts.models import Contract

from .models import ChangeIncident


class ChangeIncidentService:
    """Service class for change/incident operations."""

    @staticmethod
    def get_all() -> QuerySet[ChangeIncident]:
        """Get all events."""
        return ChangeIncident.objects.select_related("contract", "related_event").all()

    @staticmethod
    def get_by_contract(contract_id: int) -> QuerySet[ChangeIncident]:
        """Get events for a specific contract."""
        return ChangeIncident.objects.filter(contract_id=contract_id).select_related(
            "contract", "related_event"
        )

    @staticmethod
    def get_by_id(event_id: int) -> ChangeIncident:
        """Get an event by ID."""
        try:
            return ChangeIncident.objects.select_related(
                "contract", "related_event"
            ).get(pk=event_id)
        except ChangeIncident.DoesNotExist:
            raise ResourceNotFoundError(f"Event with id {event_id} not found")

    @staticmethod
    def create(data: dict) -> ChangeIncident:
        """Create a new event."""
        contract_id = data.pop("contract", None)
        if contract_id:
            try:
                contract = Contract.objects.get(pk=contract_id)
            except Contract.DoesNotExist:
                raise ResourceNotFoundError(f"Contract with id {contract_id} not found")
            data["contract"] = contract

        event = ChangeIncident(**data)
        event.full_clean()  # Validate timestamp ordering
        event.save()

        # Generate summaries
        from .summary import generate_summaries

        generate_summaries(event)

        return event

    @staticmethod
    def update(event: ChangeIncident, data: dict) -> ChangeIncident:
        """Update an event."""
        for key, value in data.items():
            if key != "contract":  # Don't allow changing contract
                setattr(event, key, value)
        event.full_clean()
        event.save()

        # Regenerate summaries
        from .summary import generate_summaries

        generate_summaries(event)

        return event

    @staticmethod
    def link_event(event: ChangeIncident, related_event_id: int) -> ChangeIncident:
        """Link an event to another event."""
        try:
            related = ChangeIncident.objects.get(pk=related_event_id)
        except ChangeIncident.DoesNotExist:
            raise ResourceNotFoundError(f"Event with id {related_event_id} not found")

        if related.contract_id != event.contract_id:
            raise BusinessLogicError("Cannot link events from different contracts")

        if related.id == event.id:
            raise BusinessLogicError("Cannot link event to itself")

        event.related_event = related
        event.save()
        return event

    @staticmethod
    def get_timeline(contract_id: int) -> QuerySet[ChangeIncident]:
        """Get events as a timeline ordered by occurred_at."""
        return ChangeIncident.objects.filter(contract_id=contract_id).order_by(
            "occurred_at"
        )
