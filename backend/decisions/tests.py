"""Tests for decisions app - DecisionLog immutability and permissions."""

from django.db.models import ProtectedError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from contracts.models import Contract
from tasks.models import Task
from users.models import Role, User

from .models import DecisionLog


def _make_task():
    contract = Contract.objects.create(
        name="Decision Contract",
        client_org="Client",
        start_date="2024-01-01",
        end_date="2024-12-31",
        status="pre-handover",
    )
    return Task.objects.create(
        contract=contract,
        task_type="routine",
        title="Task for decision",
    )


class DecisionLogModelTestCase(TestCase):
    """Model-level immutability guarantees for DecisionLog."""

    def setUp(self):
        self.task = _make_task()
        self.decision = DecisionLog.objects.create(
            task=self.task,
            actor_role="pm",
            rationale_notes="Initial rationale",
        )

    def test_cannot_update_after_creation(self):
        """save() on an existing pk must raise."""
        self.decision.rationale_notes = "Changed"
        with self.assertRaises(ValueError):
            self.decision.save()

    def test_cannot_delete(self):
        """delete() must raise."""
        with self.assertRaises(ValueError):
            self.decision.delete()


class DecisionLogProtectTestCase(TestCase):
    """DB-level PROTECT guarantee on the task FK."""

    def test_deleting_task_with_decision_logs_raises(self):
        """Task.delete() itself raises ValidationError (delete blocked)."""
        from django.core.exceptions import ValidationError

        task = _make_task()
        DecisionLog.objects.create(task=task, actor_role="pm")
        with self.assertRaises(ValidationError):
            task.delete()

    def test_queryset_delete_is_protected(self):
        """Bulk-deleting a task that has decision logs hits PROTECT."""
        task = _make_task()
        DecisionLog.objects.create(task=task, actor_role="pm")
        with self.assertRaises(ProtectedError):
            Task.objects.filter(pk=task.pk).delete()


class DecisionLogAPITestCase(TestCase):
    """API-level immutability and permission enforcement."""

    def setUp(self):
        self.client = APIClient()
        self.pm_role = Role.objects.create(name="pm", description="Project Manager")
        self.eng_role = Role.objects.create(name="engineer", description="Engineer")

        self.pm = User.objects.create_user(
            username="pm",
            email="pm@example.com",
            password="pmpass123",
        )
        self.pm.roles.add(self.pm_role)

        self.engineer = User.objects.create_user(
            username="eng",
            email="eng@example.com",
            password="engpass123",
        )
        self.engineer.roles.add(self.eng_role)

        self.task = _make_task()
        self.decision = DecisionLog.objects.create(
            task=self.task,
            actor_role="pm",
            rationale_notes="Original",
        )

    def _auth(self, email, password):
        response = self.client.post(
            "/api/token/",
            {"email": email, "password": password},
        )
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_pm_patch_blocked_by_immutability(self):
        """PM is permitted by the view but immutability blocks the update."""
        self._auth("pm@example.com", "pmpass123")
        response = self.client.patch(
            f"/api/v1/decisions/{self.decision.id}/",
            {"rationale_notes": "Updated"},
        )
        # ImmutableRecordError -> not a 200; record is unchanged.
        self.assertNotEqual(response.status_code, status.HTTP_200_OK)
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.rationale_notes, "Original")

    def test_engineer_patch_forbidden(self):
        """Engineer (non-PM) is forbidden from modifying decision logs."""
        self._auth("eng@example.com", "engpass123")
        response = self.client.patch(
            f"/api/v1/decisions/{self.decision.id}/",
            {"rationale_notes": "Hacked"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.decision.refresh_from_db()
        self.assertEqual(self.decision.rationale_notes, "Original")
