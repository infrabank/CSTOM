"""Equipment and EquipmentTransaction models for check-in/check-out management."""

from django.db import models
from contracts.models import Contract


class Equipment(models.Model):
    """Equipment item that can be checked in/out."""

    CATEGORY_CHOICES = [
        ("server", "Server"),
        ("network", "Network Device"),
        ("storage", "Storage"),
        ("security", "Security Device"),
        ("pc", "PC/Workstation"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("available", "Available"),
        ("checked_out", "Checked Out"),
        ("maintenance", "Under Maintenance"),
        ("retired", "Retired"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="equipments",
    )
    name = models.CharField(max_length=255, verbose_name="Equipment Name")
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )
    serial_number = models.CharField(
        max_length=100, unique=True, verbose_name="Serial Number"
    )
    model_name = models.CharField(max_length=255, blank=True, verbose_name="Model")
    manufacturer = models.CharField(
        max_length=255, blank=True, verbose_name="Manufacturer"
    )
    location = models.CharField(
        max_length=255, blank=True, verbose_name="Storage Location"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="available"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.serial_number})"


class EquipmentTransaction(models.Model):
    """Record of equipment check-in/check-out transactions."""

    TRANSACTION_TYPES = [
        ("check_out", "Check Out"),
        ("check_in", "Check In"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    handler_name = models.CharField(max_length=100, verbose_name="Handler Name")
    handler_affiliation = models.CharField(
        max_length=255, blank=True, verbose_name="Handler Affiliation"
    )
    handler_contact = models.CharField(
        max_length=100, blank=True, verbose_name="Handler Contact"
    )
    purpose = models.TextField(blank=True, verbose_name="Purpose")
    expected_return_date = models.DateField(
        null=True, blank=True, verbose_name="Expected Return Date"
    )
    transaction_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-transaction_date"]

    def __str__(self):
        return f"{self.equipment.name} - {self.get_transaction_type_display()} by {self.handler_name}"

    def save(self, *args, **kwargs):
        """Update equipment status on transaction save."""
        super().save(*args, **kwargs)
        if self.transaction_type == "check_out":
            self.equipment.status = "checked_out"
        elif self.transaction_type == "check_in":
            self.equipment.status = "available"
        self.equipment.save()
