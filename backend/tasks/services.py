"""Task business logic services."""

from django.db.models import QuerySet

from common.errors import ResourceNotFoundError

from .models import Task


class TaskService:
    """Service class for task operations."""

    @staticmethod
    def get_all() -> QuerySet[Task]:
        """Get all tasks."""
        return Task.objects.select_related("contract").all()

    @staticmethod
    def get_by_contract(contract_id: int) -> QuerySet[Task]:
        """Get tasks for a specific contract."""
        return Task.objects.filter(contract_id=contract_id).select_related("contract")

    @staticmethod
    def get_by_id(task_id: int) -> Task:
        """Get a task by ID."""
        try:
            return Task.objects.select_related("contract").get(pk=task_id)
        except Task.DoesNotExist:
            raise ResourceNotFoundError(f"Task with id {task_id} not found")

    @staticmethod
    def create(data: dict) -> Task:
        """Create a new task.

        Note: DRF ModelSerializer converts FK fields to model instances,
        so data["contract"] is already a Contract instance.
        """
        return Task.objects.create(**data)

    @staticmethod
    def update(task: Task, data: dict) -> Task:
        """Update a task."""
        for key, value in data.items():
            if key != "contract":  # Don't allow changing contract
                setattr(task, key, value)
        task.save()
        return task
