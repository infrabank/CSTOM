"""User and Role models for RBAC."""

from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """Role definitions for RBAC."""

    ROLE_CHOICES = [
        ("pm", "Project Manager"),
        ("engineer", "Engineer"),
        ("admin", "Administrator"),
        ("customer", "Customer"),
    ]

    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_name_display()


class User(AbstractUser):
    """Custom user model with role assignments."""

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
    ]

    display_name = models.CharField(max_length=150, blank=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.username

    def has_role(self, role_name: str) -> bool:
        """Check if user has the specified role."""
        return self.roles.filter(name=role_name).exists()

    def is_pm(self) -> bool:
        return self.has_role("pm")

    def is_engineer(self) -> bool:
        return self.has_role("engineer")

    def is_admin_role(self) -> bool:
        return self.has_role("admin")

    def is_customer(self) -> bool:
        return self.has_role("customer")

    @property
    def primary_role(self) -> str | None:
        """Return the highest-priority role for the user."""
        priority = ["admin", "pm", "engineer", "customer"]
        for role_name in priority:
            if self.has_role(role_name):
                return role_name
        return None
