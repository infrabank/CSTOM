"""Signals for equipment change tracking via AssetHistory."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import AssetHistory, Equipment

# Fields to track for changes
TRACKED_FIELDS = {
    "purchase_date",
    "warranty_expiry_date",
    "ip_address",
    "mac_address",
    "operating_system",
    "name",
    "category",
    "status",
    "location",
    "notes",
}


@receiver(pre_save, sender=Equipment)
def capture_equipment_pre_save(sender, instance, **kwargs):
    """Capture the before state of equipment for change tracking."""
    if instance.pk:
        try:
            instance._equipment_before = sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            instance._equipment_before = None
    else:
        instance._equipment_before = None


@receiver(post_save, sender=Equipment)
def record_equipment_changes(sender, instance, created, **kwargs):
    """Record equipment changes to AssetHistory."""
    if created:
        # Don't record history for new equipment
        return

    before = getattr(instance, "_equipment_before", None)
    if not before:
        return

    # Get the current request user if available
    request = getattr(instance, "_request", None)
    changed_by = None
    if request and hasattr(request, "user") and request.user.is_authenticated:
        changed_by = request.user

    # Check each tracked field for changes
    for field_name in TRACKED_FIELDS:
        old_value = getattr(before, field_name, None)
        new_value = getattr(instance, field_name, None)

        # Convert to string for comparison and storage
        old_str = str(old_value) if old_value is not None else None
        new_str = str(new_value) if new_value is not None else None

        # Only record if value actually changed
        if old_str != new_str:
            AssetHistory.objects.create(
                equipment=instance,
                field_name=field_name,
                old_value=old_str,
                new_value=new_str,
                changed_by=changed_by,
            )
