"""Tests for users app - Auth and User CRUD."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Role, User


class AuthTestCase(TestCase):
    """Test JWT authentication endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_token_obtain_success(self):
        """Test successful JWT token obtain."""
        response = self.client.post(
            "/api/token/",
            {"email": "test@example.com", "password": "testpass123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_token_obtain_invalid_credentials(self):
        """Test JWT token obtain with invalid credentials."""
        response = self.client.post(
            "/api/token/",
            {"email": "test@example.com", "password": "wrongpassword"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        """Test JWT token refresh."""
        # First obtain tokens
        response = self.client.post(
            "/api/token/",
            {"email": "test@example.com", "password": "testpass123"},
        )
        refresh_token = response.data["refresh"]

        # Then refresh
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh": refresh_token},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


class UserCRUDTestCase(TestCase):
    """Test User CRUD operations."""

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

        # Authenticate as admin
        response = self.client.post(
            "/api/token/",
            {"email": "admin@example.com", "password": "adminpass123"},
        )
        self.token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_list_users(self):
        """Test listing users."""
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)

    def test_create_user(self):
        """Test creating a new user."""
        response = self.client.post(
            "/api/v1/users/",
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "NewPass123!",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "newuser@example.com")

    def test_retrieve_user(self):
        """Test retrieving a user."""
        response = self.client.get(f"/api/v1/users/{self.admin.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "admin@example.com")

    def test_unauthorized_access(self):
        """Test unauthorized access to user list."""
        # Remove credentials
        self.client.credentials()
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RoleTestCase(TestCase):
    """Test Role operations."""

    def setUp(self):
        self.client = APIClient()
        self.pm_role = Role.objects.create(name="pm", description="Project Manager")
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

    def test_list_roles(self):
        """Test listing roles."""
        response = self.client.get("/api/v1/roles/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_assign_role_to_user(self):
        """Test assigning role to user."""
        # Create a user without roles
        user = User.objects.create_user(
            username="norole",
            email="norole@example.com",
            password="pass123",
        )

        response = self.client.patch(
            f"/api/v1/users/{user.id}/roles/",
            {"role_ids": [self.pm_role.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify role was assigned
        user.refresh_from_db()
        self.assertTrue(user.has_role("pm"))


class UserManagementPermissionTestCase(TestCase):
    """Only admins may manage users (assign_role / update). PM cannot."""

    def setUp(self):
        self.client = APIClient()
        self.pm_role = Role.objects.create(name="pm", description="Project Manager")
        self.admin_role = Role.objects.create(name="admin", description="Administrator")

        self.pm = User.objects.create_user(
            username="pm", email="pm@example.com", password="pmpass123"
        )
        self.pm.roles.add(self.pm_role)

        self.admin = User.objects.create_user(
            username="admin", email="admin@example.com", password="adminpass123"
        )
        self.admin.roles.add(self.admin_role)

        self.target = User.objects.create_user(
            username="target", email="target@example.com", password="targetpass123"
        )

    def _auth(self, email, password):
        response = self.client.post(
            "/api/token/", {"email": email, "password": password}
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def test_pm_assign_role_forbidden(self):
        self._auth("pm@example.com", "pmpass123")
        response = self.client.patch(
            f"/api/v1/users/{self.target.id}/roles/",
            {"role_ids": [self.pm_role.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_pm_update_user_forbidden(self):
        self._auth("pm@example.com", "pmpass123")
        response = self.client.patch(
            f"/api/v1/users/{self.target.id}/",
            {"display_name": "Renamed"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_assign_role_succeeds(self):
        self._auth("admin@example.com", "adminpass123")
        response = self.client.patch(
            f"/api/v1/users/{self.target.id}/roles/",
            {"role_ids": [self.pm_role.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.target.refresh_from_db()
        self.assertTrue(self.target.has_role("pm"))
