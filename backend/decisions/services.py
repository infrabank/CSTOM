"""DecisionLog business logic services."""

from django.db.models import QuerySet

from common.errors import ImmutableRecordError, ResourceNotFoundError

from .models import DecisionLog


class DecisionLogService:
    """Service class for decision log operations."""

    @staticmethod
    def get_by_task(task_id: int) -> QuerySet[DecisionLog]:
        """Get decision logs for a specific task."""
        return DecisionLog.objects.filter(task_id=task_id).select_related("task")

    @staticmethod
    def get_by_id(decision_id: int) -> DecisionLog:
        """Get a decision log by ID."""
        try:
            return DecisionLog.objects.select_related("task").get(pk=decision_id)
        except DecisionLog.DoesNotExist:
            raise ResourceNotFoundError(f"DecisionLog with id {decision_id} not found")

    @staticmethod
    def create(data: dict) -> DecisionLog:
        """Create a new decision log (append-only).

        Note: DRF ModelSerializer already validates and converts the task field
        to a Task instance, so we can create directly.
        """
        return DecisionLog.objects.create(**data)

    @staticmethod
    def update(decision: DecisionLog, data: dict) -> DecisionLog:
        """Decision logs are immutable - raises error."""
        raise ImmutableRecordError("DecisionLog records cannot be modified.")

    @staticmethod
    def delete(decision: DecisionLog) -> None:
        """Decision logs are immutable - raises error."""
        raise ImmutableRecordError("DecisionLog records cannot be deleted.")
