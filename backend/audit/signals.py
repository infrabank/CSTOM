"""Audit logging hooks using Django signals."""

import threading
import uuid

from django.apps import apps
from django.db.models.signals import post_save, pre_delete, pre_save

from .models import AuditEvent

_request_context = threading.local()


def set_request_context(request):
    """Set the current request context for audit logging."""
    _request_context.request = request
    _request_context.request_id = str(uuid.uuid4())


def get_request_context():
    """Get the current request context."""
    return getattr(_request_context, "request", None)


def get_request_id():
    """Get the current request ID."""
    return getattr(_request_context, "request_id", "")


def clear_request_context():
    """Clear the current request context."""
    _request_context.request = None
    _request_context.request_id = ""


class AuditMiddleware:
    """Middleware to set request context for audit logging."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_request_context(request)
        try:
            response = self.get_response(request)
        finally:
            clear_request_context()
        return response


def create_audit_event(
    action_type: str,
    entity_type: str,
    entity_id: str = "",
    before_snapshot: dict | None = None,
    after_snapshot: dict | None = None,
):
    """Create an audit event with current request context."""
    request = get_request_context()

    actor = None
    actor_role = ""
    ip_address = None
    user_agent = ""

    if request:
        if hasattr(request, "user") and request.user.is_authenticated:
            actor = request.user
            actor_role = request.user.primary_role or ""
        ip_address = get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")

    AuditEvent.objects.create(
        actor=actor,
        actor_role=actor_role,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=str(entity_id),
        request_id=get_request_id(),
        ip_address=ip_address,
        user_agent=user_agent,
        before_snapshot=before_snapshot,
        after_snapshot=after_snapshot,
    )


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


# Models that should be audited
AUDITED_MODELS = [
    "contracts.Contract",
    "tasks.Task",
    "decisions.DecisionLog",
    "events.ChangeIncident",
    "reports.Report",
    "users.User",
]


def model_to_dict(instance):
    """Convert model instance to dict for snapshot."""
    from decimal import Decimal

    if instance is None:
        return None
    data = {}
    for field in instance._meta.fields:
        value = getattr(instance, field.name)
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        elif hasattr(value, "pk"):
            value = value.pk
        elif isinstance(value, Decimal):
            value = str(value)
        data[field.name] = value
    return data


def capture_pre_save(sender, instance, **kwargs):
    """Capture the before state of an object."""
    model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"

    if instance.pk:
        try:
            instance._audit_before = model_to_dict(sender.objects.get(pk=instance.pk))
        except sender.DoesNotExist:
            instance._audit_before = None
    else:
        instance._audit_before = None


def audit_post_save(sender, instance, created, **kwargs):
    """Log create/update events after save."""
    model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"

    action = "create" if created else "update"
    before = getattr(instance, "_audit_before", None)
    after = model_to_dict(instance)

    create_audit_event(
        action_type=action,
        entity_type=model_name,
        entity_id=instance.pk,
        before_snapshot=before,
        after_snapshot=after,
    )


def audit_pre_delete(sender, instance, **kwargs):
    """Log delete events before deletion."""
    model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"

    before = model_to_dict(instance)

    create_audit_event(
        action_type="delete",
        entity_type=model_name,
        entity_id=instance.pk,
        before_snapshot=before,
        after_snapshot=None,
    )


def connect_audit_signals():
    """Connect audit receivers explicitly per audited model.

    Scoping each receiver to a specific sender ensures non-audited
    models never trigger audit logging.
    """
    for model_path in AUDITED_MODELS:
        app_label, model_name = model_path.split(".")
        model = apps.get_model(app_label, model_name)
        pre_save.connect(capture_pre_save, sender=model)
        post_save.connect(audit_post_save, sender=model)
        pre_delete.connect(audit_pre_delete, sender=model)


connect_audit_signals()
