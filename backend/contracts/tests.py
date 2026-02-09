"""Tests for contracts app - Contract CRUD and status operations."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import Role, User

from .models import Contract


class ContractCRUDTestCase(TestCase):
    """Test Contract CRUD operations."""

    def setUp(self):
        self.client = APIClient()
        # Create admin user with PM/Admin role
        self.admin_role = Role.objects.create(name="admin", description="Administrator")
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
        )
        self.admin.roles.add(self.admin_role)

        # Authenticate
        response = self.client.post(
            "/api/token/",
            {"email": "admin@example.com", "password": "adminpass123"},
        )
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        # Create a test contract
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

    def test_list_contracts(self):
        """Test listing contracts."""
        response = self.client.get("/api/v1/contracts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_contracts_unauthenticated(self):
        """Test that unauthenticated users can list contracts (public read)."""
        self.client.credentials()  # Remove auth
        response = self.client.get("/api/v1/contracts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_contract(self):
        """Test creating a new contract."""
        response = self.client.post(
            "/api/v1/contracts/",
            {
                "name": "New Contract",
                "client_org": "New Client",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Contract")
        self.assertEqual(response.data["status"], "pre-handover")

    def test_create_contract_with_scope_flags(self):
        """Test creating contract with scope flags."""
        response = self.client.post(
            "/api/v1/contracts/",
            {
                "name": "Scoped Contract",
                "client_org": "Client Org",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
                "scope_flags": "ops,build",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["scope_flags"], "ops,build")

    def test_retrieve_contract(self):
        """Test retrieving a contract."""
        response = self.client.get(f"/api/contracts/{self.contract.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Contract")

    def test_update_contract(self):
        """Test updating a contract."""
        response = self.client.put(
            f"/api/contracts/{self.contract.id}/",
            {
                "name": "Updated Contract",
                "client_org": "Updated Client",
                "start_date": "2024-01-01",
                "end_date": "2024-12-31",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Contract")

    def test_partial_update_contract(self):
        """Test partial update of a contract."""
        response = self.client.patch(
            f"/api/contracts/{self.contract.id}/",
            {"client_org": "Patched Client"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["client_org"], "Patched Client")

    def test_delete_contract(self):
        """Test deleting a contract."""
        response = self.client.delete(f"/api/contracts/{self.contract.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Contract.objects.filter(id=self.contract.id).exists())

    def test_create_contract_unauthenticated(self):
        """Test that unauthenticated users cannot create contracts."""
        self.client.credentials()
        response = self.client.post(
            "/api/v1/contracts/",
            {
                "name": "Unauthorized Contract",
                "client_org": "Client",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ContractStatusTestCase(TestCase):
    """Test Contract status update operations."""

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
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.contract = Contract.objects.create(
            name="Status Test Contract",
            client_org="Test Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

    def test_update_status(self):
        """Test updating contract status."""
        response = self.client.post(
            f"/api/contracts/{self.contract.id}/status/",
            {"status": "handover", "notes": "Starting handover phase"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "handover")

    def test_status_history(self):
        """Test getting contract status history."""
        # First update status
        self.client.post(
            f"/api/contracts/{self.contract.id}/status/",
            {"status": "handover"},
        )

        response = self.client.get(f"/api/contracts/{self.contract.id}/history/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["old_status"], "pre-handover")
        self.assertEqual(response.data[0]["new_status"], "handover")

    def test_status_progression(self):
        """Test status can progress through valid states."""
        statuses = ["handover", "stabilization", "steady", "closed"]

        for new_status in statuses:
            response = self.client.post(
                f"/api/contracts/{self.contract.id}/status/",
                {"status": new_status},
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data["status"], new_status)


class ContractRiskFlagsTestCase(TestCase):
    """Test Contract risk flags functionality."""

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
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_create_contract_with_risk_flags(self):
        """Test creating contract with risk flags set."""
        response = self.client.post(
            "/api/v1/contracts/",
            {
                "name": "Risky Contract",
                "client_org": "Risk Client",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
                "risk_pre_env": True,
                "risk_prior_vendor": True,
                "risk_docs_incomplete": False,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["risk_pre_env"])
        self.assertTrue(response.data["risk_prior_vendor"])
        self.assertFalse(response.data["risk_docs_incomplete"])
