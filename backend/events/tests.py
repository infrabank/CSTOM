"""Tests for events app - delete blocking and customer access."""

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from contracts.models import Contract
from users.models import Role, User

from .models import ChangeIncident


def _make_contract():
    return Contract.objects.create(
        name="Event Contract",
        client_org="Client",
        start_date="2024-01-01",
        end_date="2024-12-31",
        status="pre-handover",
    )


def _make_incident(contract):
    return ChangeIncident.objects.create(
        contract=contract,
        record_type="incident",
        title="Outage",
        occurred_at=timezone.now(),
    )


class ChangeIncidentModelTestCase(TestCase):
    """Model-level delete guarantee."""

    def test_delete_raises(self):
        contract = _make_contract()
        incident = _make_incident(contract)
        with self.assertRaises(ValidationError):
            incident.delete()


class ChangeIncidentDeleteAPITestCase(TestCase):
    """DELETE method is not allowed at the API."""

    def setUp(self):
        self.client = APIClient()
        self.admin_role = Role.objects.create(name="admin", description="Administrator")
        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass123"
        )
        self.admin.roles.add(self.admin_role)

        response = self.client.post(
            "/api/token/", {"email": "admin@example.com", "password": "adminpass123"}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

        self.contract = _make_contract()
        self.incident = _make_incident(self.contract)

    def test_delete_returns_405(self):
        response = self.client.delete(f"/api/v1/events/{self.incident.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(ChangeIncident.objects.filter(id=self.incident.id).exists())


class ChangeIncidentCustomerAccessTestCase(TestCase):
    """Customer role is read-only for events."""

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
            "/api/v1/events/",
            {
                "contract": self.contract.id,
                "record_type": "incident",
                "title": "Customer event",
                "occurred_at": timezone.now().isoformat(),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_customer_list_allowed(self):
        response = self.client.get("/api/v1/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
