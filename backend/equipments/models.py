"""Equipment and EquipmentTransaction models for check-in/check-out management."""

from django.conf import settings
from django.db import models

from common.errors import ValidationError
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

    def delete(self, *args, **kwargs):
        """Prevent hard deletion of Equipment records (Task 008).

        Equipment records must be preserved for audit trail integrity.
        Use status='retired' instead of deletion.
        """
        raise ValidationError(
            "Equipment records cannot be deleted. "
            "Set status to 'retired' instead to decommission equipment."
        )


class EquipmentTransaction(models.Model):
    """Record of equipment check-in/check-out transactions. Immutable after creation."""

    TRANSACTION_TYPES = [
        ("check_out", "Check Out"),
        ("check_in", "Check In"),
    ]

    OPERATIONAL_CONTEXT_TYPES = [
        ("incident", "Incident"),
        ("change", "Change Request"),
        ("task", "Task"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)

    handler_name = models.CharField(max_length=100)
    handler_affiliation = models.CharField(max_length=255)
    handler_contact = models.CharField(max_length=100)

    purpose = models.TextField(verbose_name="Rationale")
    expected_return_date = models.DateField(null=True, blank=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="approved_transactions",
        null=True,
        blank=True,
    )
    approver_role = models.CharField(max_length=20, default="")
    contract_status_at_approval = models.CharField(max_length=30, default="")
    requires_pm_approval = models.BooleanField(default=False)
    pm_approval_obtained = models.BooleanField(default=False)

    operational_context_type = models.CharField(
        max_length=20,
        choices=OPERATIONAL_CONTEXT_TYPES,
        blank=True,
        null=True,
    )
    operational_context_id = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        ordering = ["-transaction_date"]

    def __str__(self):
        return f"{self.equipment.name} - {self.get_transaction_type_display()} by {self.handler_name}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not is_new:
            raise ValidationError(
                "EquipmentTransaction records are immutable and cannot be modified."
            )

        super().save(*args, **kwargs)

        if self.transaction_type == "check_out":
            self.equipment.status = "checked_out"
        elif self.transaction_type == "check_in":
            self.equipment.status = "available"
        self.equipment.save()

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "EquipmentTransaction records are immutable and cannot be deleted."
        )


class EquipmentCorrection(models.Model):
    """Compensating entry for Equipment data corrections (Task 008).

    Since Equipment and EquipmentTransaction records are immutable,
    corrections are recorded as separate entries that reference the
    original records and document the correction rationale.
    """

    CORRECTION_TYPES = [
        ("equipment_data", "Equipment Data Correction"),
        ("transaction_void", "Transaction Void/Reversal"),
        ("status_override", "Status Override"),
        ("other", "Other Correction"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="corrections",
    )
    original_transaction = models.ForeignKey(
        EquipmentTransaction,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="corrections",
        help_text="The transaction being corrected (if applicable)",
    )
    correction_type = models.CharField(max_length=30, choices=CORRECTION_TYPES)
    description = models.TextField(
        help_text="Detailed explanation of the error and correction"
    )
    corrected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="equipment_corrections",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # For status overrides, record the new status
    new_status = models.CharField(
        max_length=20,
        choices=Equipment.STATUS_CHOICES,
        blank=True,
        help_text="New status if this is a status override correction",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Correction for {self.equipment.name}: {self.get_correction_type_display()}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # If this is a status override, update the equipment status
        if is_new and self.correction_type == "status_override" and self.new_status:
            self.equipment.status = self.new_status
            # Bypass the normal save to allow status update
            Equipment.objects.filter(pk=self.equipment.pk).update(
                status=self.new_status
            )
