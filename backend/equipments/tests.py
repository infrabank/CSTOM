"""Tests for equipments app - Equipment CRUD and check-in/check-out operations."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from contracts.models import Contract
from users.models import Role, User

from .models import Equipment, EquipmentTransaction


class EquipmentCRUDTestCase(TestCase):
    """Test Equipment CRUD operations."""

    def setUp(self):
        self.client = APIClient()
        # Create admin user
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

        # Create test contract
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="steady",
        )

        # Create test equipment
        self.equipment = Equipment.objects.create(
            contract=self.contract,
            name="Test Server",
            category="server",
            serial_number="SRV-001",
            model_name="Dell R740",
            manufacturer="Dell",
            location="DC-A Rack-01",
            status="available",
        )

    def test_list_equipments(self):
        """Test listing equipments."""
        response = self.client.get("/api/v1/equipments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_equipments_unauthenticated(self):
        """Test that unauthenticated users cannot list equipments."""
        self.client.credentials()
        response = self.client.get("/api/v1/equipments/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_equipment(self):
        """Test creating new equipment."""
        response = self.client.post(
            "/api/v1/equipments/",
            {
                "contract": self.contract.id,
                "name": "New Switch",
                "category": "network",
                "serial_number": "SW-002",
                "model_name": "Cisco 9300",
                "manufacturer": "Cisco",
                "location": "DC-B Rack-05",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Switch")
        self.assertEqual(response.data["status"], "available")

    def test_create_equipment_duplicate_serial(self):
        """Test that duplicate serial numbers are rejected."""
        response = self.client.post(
            "/api/v1/equipments/",
            {
                "contract": self.contract.id,
                "name": "Duplicate Server",
                "category": "server",
                "serial_number": "SRV-001",  # Already exists
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_equipment(self):
        """Test retrieving equipment."""
        response = self.client.get(f"/api/v1/equipments/{self.equipment.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Server")
        self.assertEqual(response.data["serial_number"], "SRV-001")

    def test_update_equipment(self):
        """Test updating equipment."""
        response = self.client.put(
            f"/api/v1/equipments/{self.equipment.id}/",
            {
                "contract": self.contract.id,
                "name": "Updated Server",
                "category": "server",
                "serial_number": "SRV-001",
                "location": "DC-C Rack-10",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Server")
        self.assertEqual(response.data["location"], "DC-C Rack-10")

    def test_partial_update_equipment(self):
        """Test partial update of equipment."""
        response = self.client.patch(
            f"/api/v1/equipments/{self.equipment.id}/",
            {"notes": "Updated notes for equipment"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["notes"], "Updated notes for equipment")

    def test_equipment_cannot_be_deleted(self):
        """Test that equipment cannot be hard-deleted (immutable)."""
        response = self.client.delete(f"/api/v1/equipments/{self.equipment.id}/")
        # Should fail because Equipment.delete() raises ValidationError
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR],
        )
        # Equipment should still exist
        self.assertTrue(Equipment.objects.filter(id=self.equipment.id).exists())

    def test_create_equipment_unauthenticated(self):
        """Test that unauthenticated users cannot create equipment."""
        self.client.credentials()
        response = self.client.post(
            "/api/v1/equipments/",
            {
                "contract": self.contract.id,
                "name": "Unauthorized Equipment",
                "category": "other",
                "serial_number": "UNA-001",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class EquipmentCheckOutTestCase(TestCase):
    """Test Equipment check-out operations."""

    def setUp(self):
        self.client = APIClient()
        # Create engineer role and user
        self.engineer_role = Role.objects.create(
            name="engineer", description="Engineer"
        )
        self.engineer = User.objects.create_user(
            username="engineer",
            email="engineer@example.com",
            password="engpass123",
        )
        self.engineer.roles.add(self.engineer_role)

        # Authenticate
        response = self.client.post(
            "/api/token/",
            {"email": "engineer@example.com", "password": "engpass123"},
        )
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        # Create test data (pre-handover = non-operational, no PM approval needed)
        self.contract = Contract.objects.create(
            name="Pre-Handover Contract",
            client_org="Client Corp",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

        self.equipment = Equipment.objects.create(
            contract=self.contract,
            name="Available Server",
            category="server",
            serial_number="AV-001",
            status="available",
        )

    def test_check_out_equipment(self):
        """Test checking out available equipment."""
        response = self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-out/",
            {
                "handler_name": "John Doe",
                "handler_affiliation": "IT Department",
                "handler_contact": "john@example.com",
                "rationale": "Server replacement for maintenance",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["transaction_type"], "check_out")

        # Verify equipment status changed
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "checked_out")

    def test_check_out_with_expected_return_date(self):
        """Test check-out with expected return date."""
        response = self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-out/",
            {
                "handler_name": "Jane Smith",
                "handler_affiliation": "DevOps Team",
                "handler_contact": "jane@example.com",
                "rationale": "Temporary use for load testing",
                "expected_return_date": "2025-02-15",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["expected_return_date"], "2025-02-15")

    def test_check_out_already_checked_out(self):
        """Test that already checked out equipment cannot be checked out again."""
        # First check-out
        self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-out/",
            {
                "handler_name": "First User",
                "handler_affiliation": "Team A",
                "handler_contact": "first@example.com",
                "rationale": "First checkout",
            },
        )

        # Second check-out attempt
        response = self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-out/",
            {
                "handler_name": "Second User",
                "handler_affiliation": "Team B",
                "handler_contact": "second@example.com",
                "rationale": "Second checkout attempt",
            },
        )
        # Should fail because equipment is already checked out
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN],
        )


class EquipmentCheckInTestCase(TestCase):
    """Test Equipment check-in operations."""

    def setUp(self):
        self.client = APIClient()
        # Create engineer role and user
        self.engineer_role = Role.objects.create(
            name="engineer", description="Engineer"
        )
        self.engineer = User.objects.create_user(
            username="engineer",
            email="engineer@example.com",
            password="engpass123",
        )
        self.engineer.roles.add(self.engineer_role)

        # Authenticate
        response = self.client.post(
            "/api/token/",
            {"email": "engineer@example.com", "password": "engpass123"},
        )
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        # Create test data (pre-handover = non-operational, no PM approval needed)
        self.contract = Contract.objects.create(
            name="Pre-Handover Contract",
            client_org="Client Corp",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

        self.equipment = Equipment.objects.create(
            contract=self.contract,
            name="Checked Out Server",
            category="server",
            serial_number="CO-001",
            status="checked_out",
        )

    def test_check_in_equipment(self):
        """Test checking in checked-out equipment."""
        response = self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-in/",
            {
                "handler_name": "John Doe",
                "handler_affiliation": "IT Department",
                "handler_contact": "john@example.com",
                "rationale": "Returning after maintenance",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["transaction_type"], "check_in")

        # Verify equipment status changed
        self.equipment.refresh_from_db()
        self.assertEqual(self.equipment.status, "available")

    def test_check_in_available_equipment(self):
        """Test that available equipment cannot be checked in."""
        self.equipment.status = "available"
        Equipment.objects.filter(pk=self.equipment.pk).update(status="available")

        response = self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-in/",
            {
                "handler_name": "User",
                "handler_affiliation": "Team",
                "handler_contact": "user@example.com",
                "rationale": "Invalid check-in",
            },
        )
        # Should fail because equipment is already available
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN],
        )


class EquipmentTransactionHistoryTestCase(TestCase):
    """Test Equipment transaction history endpoints."""

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
            name="Test Contract",
            client_org="Test Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

        self.equipment = Equipment.objects.create(
            contract=self.contract,
            name="History Test Server",
            category="server",
            serial_number="HIS-001",
            status="available",
        )

    def test_get_transactions(self):
        """Test getting equipment transactions."""
        # Create a check-out transaction first
        self.client.post(
            f"/api/v1/equipments/{self.equipment.id}/check-out/",
            {
                "handler_name": "Test Handler",
                "handler_affiliation": "Test Team",
                "handler_contact": "test@example.com",
                "rationale": "Test checkout",
            },
        )

        response = self.client.get(
            f"/api/v1/equipments/{self.equipment.id}/transactions/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["transaction_type"], "check_out")

    def test_custody_history(self):
        """Test getting custody history."""
        response = self.client.get(
            f"/api/v1/equipments/{self.equipment.id}/custody-history/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("equipment_id", response.data)
        self.assertIn("transactions", response.data)


class EquipmentCategoryFilterTestCase(TestCase):
    """Test Equipment filtering by category."""

    def setUp(self):
        self.client = APIClient()

        # Create and authenticate user
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
            name="Filter Test Contract",
            client_org="Filter Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="steady",
        )

        # Create equipment of different categories
        Equipment.objects.create(
            contract=self.contract,
            name="Server 1",
            category="server",
            serial_number="SRV-F01",
            status="available",
        )
        Equipment.objects.create(
            contract=self.contract,
            name="Switch 1",
            category="network",
            serial_number="NET-F01",
            status="available",
        )
        Equipment.objects.create(
            contract=self.contract,
            name="Storage 1",
            category="storage",
            serial_number="STO-F01",
            status="available",
        )

    def test_list_all_equipment(self):
        """Test listing all equipment without filters."""
        response = self.client.get("/api/v1/equipments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 3)
