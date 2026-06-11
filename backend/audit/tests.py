"""Tests for audit app - signal-driven audit event creation scoping."""

from django.test import TestCase

from contracts.models import Contract
from users.models import Role, User

from .models import AuditEvent


class AuditSignalTestCase(TestCase):
    """Audit events fire only for AUDITED_MODELS."""

    def test_audited_model_creates_event(self):
        """Saving a Contract (an audited model) creates an AuditEvent."""
        before = AuditEvent.objects.filter(entity_type="contracts.contract").count()

        contract = Contract.objects.create(
            name="Audited Contract",
            client_org="Client",
            start_date="2024-01-01",
            end_date="2024-12-31",
            status="pre-handover",
        )

        events = AuditEvent.objects.filter(
            entity_type="contracts.contract",
            entity_id=str(contract.id),
            action_type="create",
        )
        self.assertEqual(events.count(), 1)
        self.assertEqual(
            AuditEvent.objects.filter(entity_type="contracts.contract").count(),
            before + 1,
        )

    def test_non_audited_model_creates_no_event(self):
        """Saving a non-audited model (Notification) creates no AuditEvent."""
        from notifications.models import Notification

        user = User.objects.create_user(
            username="recipient",
            email="recipient@example.com",
            password="pass12345",
        )

        before = AuditEvent.objects.count()
        Notification.objects.create(
            recipient=user,
            type="STATUS_CHANGED",
            title="Hello",
            content="Body",
        )

        # No audit event for Notification entity type.
        self.assertFalse(
            AuditEvent.objects.filter(
                entity_type="notifications.notification"
            ).exists()
        )
        self.assertEqual(AuditEvent.objects.count(), before)

    def test_role_save_creates_no_event(self):
        """Saving a Role (non-audited) creates no AuditEvent."""
        before = AuditEvent.objects.count()
        Role.objects.create(name="pm", description="Project Manager")
        self.assertFalse(
            AuditEvent.objects.filter(entity_type="users.role").exists()
        )
        self.assertEqual(AuditEvent.objects.count(), before)
