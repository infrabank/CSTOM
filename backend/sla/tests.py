"""Tests for sla app - customer read-only enforcement."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from contracts.models import Contract
from users.models import Role, User


class SLACustomerAccessTestCase(TestCase):
    """Customers cannot create SLA definitions."""

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

        self.contract = Contract.objects.create(
            name="SLA Contract",
            client_org="Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

    def test_customer_create_definition_forbidden(self):
        response = self.client.post(
            "/api/v1/sla/definitions/",
            {
                "contract": self.contract.id,
                "service_type": "Incident Response",
                "priority": "high",
                "target_response_time_minutes": 60,
                "target_resolution_time_minutes": 240,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
