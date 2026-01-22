"""Management command to seed initial admin user."""

import os

from django.core.management.base import BaseCommand

from users.models import Role, User


class Command(BaseCommand):
    """Create initial admin user from environment variables."""

    help = "Create initial admin user if not exists"

    def handle(self, *args, **options):
        email = os.getenv("ADMIN_EMAIL")
        password = os.getenv("ADMIN_PASSWORD")

        if not email or not password:
            self.stdout.write(
                self.style.WARNING("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping")
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Admin {email} already exists"))
            return

        # Create admin user
        username = email.split("@")[0]
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            display_name="Administrator",
        )

        # Assign admin role if exists
        admin_role = Role.objects.filter(name="admin").first()
        if admin_role:
            user.roles.add(admin_role)
            self.stdout.write(f"Assigned admin role to {email}")

        self.stdout.write(self.style.SUCCESS(f"Admin user {email} created"))
