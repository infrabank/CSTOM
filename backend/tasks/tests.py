"""Tests for tasks app - delete blocking, approval RBAC, customer access."""

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from contracts.models import Contract
from users.models import Role, User

from .models import Task


def _make_contract():
    return Contract.objects.create(
        name="Task Contract",
        client_org="Client",
        start_date="2024-01-01",
        end_date="2024-12-31",
        status="pre-handover",
    )


class TaskModelTestCase(TestCase):
    """Model-level delete guarantee."""

    def test_delete_raises(self):
        contract = _make_contract()
        task = Task.objects.create(
            contract=contract, task_type="routine", title="No delete"
        )
        with self.assertRaises(ValidationError):
            task.delete()


class TaskDeleteAPITestCase(TestCase):
    """DELETE method is not allowed at the API."""

    def setUp(self):
        self.client = APIClient()
        self.admin_role = Role.objects.create(name="admin", description="Administrator")
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
        )
        self.admin.roles.add(self.admin_role)

        response = self.client.post(
            "/api/token/",
            {"email": "admin@example.com", "password": "adminpass123"},
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

        self.contract = _make_contract()
        self.task = Task.objects.create(
            contract=self.contract, task_type="routine", title="Keep me"
        )

    def test_delete_returns_405(self):
        response = self.client.delete(f"/api/v1/tasks/{self.task.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Task.objects.filter(id=self.task.id).exists())


class TaskApproveTestCase(TestCase):
    """Approval action RBAC (DB-backed role checks)."""

    def setUp(self):
        self.client = APIClient()
        self.pm_role = Role.objects.create(name="pm", description="Project Manager")
        self.eng_role = Role.objects.create(name="engineer", description="Engineer")

        self.pm = User.objects.create_user(
            username="pm", email="pm@example.com", password="pmpass123"
        )
        self.pm.roles.add(self.pm_role)

        self.engineer = User.objects.create_user(
            username="eng", email="eng@example.com", password="engpass123"
        )
        self.engineer.roles.add(self.eng_role)

        self.contract = _make_contract()

    def _auth(self, email, password):
        response = self.client.post(
            "/api/token/", {"email": email, "password": password}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def _make_approval_task(self):
        # impact_level="full" forces approval_required + pending status.
        return Task.objects.create(
            contract=self.contract,
            task_type="change",
            impact_level="full",
            title="Needs approval",
        )

    def test_engineer_cannot_approve(self):
        task = self._make_approval_task()
        self._auth("eng@example.com", "engpass123")
        response = self.client.post(
            f"/api/v1/tasks/{task.id}/approve/", {"action": "approve"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pm_can_approve(self):
        task = self._make_approval_task()
        self._auth("pm@example.com", "pmpass123")
        response = self.client.post(
            f"/api/v1/tasks/{task.id}/approve/", {"action": "approve"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["approval_status"], "approved")

    def test_revoked_pm_cannot_approve(self):
        """A user who logged in as PM but had the role revoked is denied
        based on the live DB role, not the JWT claim."""
        task = self._make_approval_task()
        self._auth("pm@example.com", "pmpass123")

        # Revoke PM role after login (JWT still claims pm).
        self.pm.roles.clear()
        # Re-fetch so the cached_property _role_names is fresh.
        self.pm = User.objects.get(pk=self.pm.pk)

        response = self.client.post(
            f"/api/v1/tasks/{task.id}/approve/", {"action": "approve"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TaskCustomerAccessTestCase(TestCase):
    """Customer role is read-only for tasks."""

    def setUp(self):
        self.client = APIClient()
        self.customer_role = Role.objects.create(
            name="customer", description="Customer"
        )
        self.customer = User.objects.create_user(
            username="cust", email="cust@example.com", password="custpass123"
        )
        self.customer.roles.add(self.customer_role)

        response = self.client.post(
            "/api/token/", {"email": "cust@example.com", "password": "custpass123"}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

        self.contract = _make_contract()

    def test_customer_create_forbidden(self):
        response = self.client.post(
            "/api/v1/tasks/",
            {
                "contract": self.contract.id,
                "task_type": "routine",
                "title": "Customer task",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_list_allowed(self):
        response = self.client.get("/api/v1/tasks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
