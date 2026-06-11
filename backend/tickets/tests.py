"""Tests for tickets app - service desk customer access exception."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import Role, User

from .models import Ticket


class TicketCustomerAccessTestCase(TestCase):
    """Customers may create and read tickets but not modify them."""

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

    def test_customer_create_ticket_allowed(self):
        """Service desk exception: customers can create tickets (201)."""
        response = self.client.post(
            "/api/v1/tickets/",
            {
                "title": "Need help",
                "description": "Something is broken",
                "priority": "high",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_customer_patch_ticket_forbidden(self):
        """Customers cannot update tickets even their own."""
        ticket = Ticket.objects.create(
            title="My ticket",
            description="Body",
            priority="medium",
            requester=self.customer,
        )
        response = self.client.patch(
            f"/api/v1/tickets/{ticket.id}/",
            {"status": "resolved"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
