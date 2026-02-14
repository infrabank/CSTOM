"""Equipment and EquipmentTransaction models for check-in/check-out management."""

from django.conf import settings
from django.db import models, transaction

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

    IMPORTANCE_GRADE_CHOICES = [
        ("A", "A등급"),
        ("B", "B등급"),
        ("C", "C등급"),
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
    importance_grade = models.CharField(
        max_length=1,
        choices=IMPORTANCE_GRADE_CHOICES,
        default="C",
        blank=True,
        help_text="장비 중요도 등급 (A: 2시간, B: 4시간, C: 8시간 복구목표)",
    )
    notes = models.TextField(blank=True)

    # CMDB fields
    purchase_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Purchase Date",
        help_text="Date when equipment was purchased",
    )
    warranty_expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Warranty Expiry Date",
        help_text="Date when warranty expires",
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="IP Address",
        help_text="IPv4 or IPv6 address",
    )
    mac_address = models.CharField(
        max_length=17,
        null=True,
        blank=True,
        verbose_name="MAC Address",
        help_text="Media Access Control address (e.g., 00:1A:2B:3C:4D:5E)",
    )
    operating_system = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Operating System",
        help_text="OS name and version (e.g., Windows Server 2022, Ubuntu 22.04)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["contract", "status"]),
        ]

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

        with transaction.atomic():
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

        with transaction.atomic():
            super().save(*args, **kwargs)

            # If this is a status override, update the equipment status
            if is_new and self.correction_type == "status_override" and self.new_status:
                self.equipment.status = self.new_status
                # Bypass the normal save to allow status update
                Equipment.objects.filter(pk=self.equipment.pk).update(
                    status=self.new_status
                )


class AssetRelationship(models.Model):
    """Track dependencies and relationships between equipment items."""

    RELATIONSHIP_TYPES = [
        ("depends_on", "Depends On"),
        ("connected_to", "Connected To"),
        ("powers", "Powers"),
        ("backed_up_by", "Backed Up By"),
        ("clustered_with", "Clustered With"),
        ("replicates_to", "Replicates To"),
        ("managed_by", "Managed By"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="outgoing_relationships",
        help_text="Source equipment",
    )
    related_equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="incoming_relationships",
        help_text="Target equipment",
    )
    relationship_type = models.CharField(
        max_length=20, choices=RELATIONSHIP_TYPES, verbose_name="Relationship Type"
    )
    description = models.TextField(
        blank=True, help_text="Additional details about the relationship"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("equipment", "related_equipment", "relationship_type")
        verbose_name_plural = "Asset Relationships"

    def __str__(self):
        return f"{self.equipment.name} {self.get_relationship_type_display()} {self.related_equipment.name}"


class AssetHistory(models.Model):
    """Immutable audit trail of equipment configuration changes."""

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="history",
        help_text="Equipment that was changed",
    )
    field_name = models.CharField(
        max_length=100,
        verbose_name="Field Name",
        help_text="Name of the field that changed",
    )
    old_value = models.TextField(
        null=True, blank=True, verbose_name="Old Value", help_text="Previous value"
    )
    new_value = models.TextField(
        null=True, blank=True, verbose_name="New Value", help_text="New value"
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_history_changes",
        help_text="User who made the change (null for system changes)",
    )
    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-changed_at"]
        verbose_name_plural = "Asset History"
        indexes = [
            models.Index(fields=["equipment", "-changed_at"]),
            models.Index(fields=["field_name", "-changed_at"]),
        ]

    def __str__(self):
        return f"{self.equipment.name}: {self.field_name} changed at {self.changed_at}"

    def save(self, *args, **kwargs):
        """AssetHistory records are immutable."""
        if self.pk:
            raise ValidationError(
                "AssetHistory records are immutable and cannot be modified."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """AssetHistory records cannot be deleted."""
        raise ValidationError("AssetHistory records cannot be deleted.")
