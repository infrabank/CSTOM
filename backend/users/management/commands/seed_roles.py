"""Management command to seed initial roles."""

from django.core.management.base import BaseCommand

from users.models import Role


class Command(BaseCommand):
    """Create initial roles if not exist."""

    help = "Create initial roles"

    def handle(self, *args, **options):
        roles = [
            ("pm", "Project Manager"),
            ("engineer", "Engineer"),
            ("admin", "Administrator"),
            ("customer", "Customer"),
        ]

        for name, description in roles:
            role, created = Role.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {name}"))
            else:
                self.stdout.write(f"Role {name} already exists")
