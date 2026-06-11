"""Tests for sop app - customer read-only enforcement."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import Role, User


class SOPCustomerAccessTestCase(TestCase):
    """Customers cannot create SOP documents."""

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

    def test_customer_create_document_forbidden(self):
        response = self.client.post(
            "/api/v1/sop/documents/",
            {"title": "Customer SOP"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
