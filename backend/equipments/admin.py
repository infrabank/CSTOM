"""Admin configuration for equipments."""

from django.contrib import admin
from .models import AssetHistory, AssetRelationship, Equipment, EquipmentTransaction


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    """Admin for Equipment model."""

    list_display = [
        "name",
        "serial_number",
        "category",
        "status",
        "contract",
        "location",
        "ip_address",
        "created_at",
    ]
    list_filter = ["category", "status", "contract", "created_at"]
    search_fields = [
        "name",
        "serial_number",
        "model_name",
        "manufacturer",
        "ip_address",
        "mac_address",
    ]

    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "serial_number", "category", "status", "contract")},
        ),
        ("Hardware Details", {"fields": ("model_name", "manufacturer", "location")}),
        (
            "CMDB Information",
            {
                "fields": (
                    "purchase_date",
                    "warranty_expiry_date",
                    "ip_address",
                    "mac_address",
                    "operating_system",
                ),
                "description": "Configuration Management Database fields for asset tracking",
            },
        ),
        ("Notes", {"fields": ("notes",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ("created_at", "updated_at")


@admin.register(EquipmentTransaction)
class EquipmentTransactionAdmin(admin.ModelAdmin):
    """Admin for EquipmentTransaction model."""

    list_display = [
        "equipment",
        "transaction_type",
        "handler_name",
        "handler_affiliation",
        "transaction_date",
    ]
    list_filter = ["transaction_type", "transaction_date"]
    search_fields = ["equipment__name", "handler_name", "handler_affiliation"]


@admin.register(AssetRelationship)
class AssetRelationshipAdmin(admin.ModelAdmin):
    """Admin for AssetRelationship model."""

    list_display = [
        "equipment",
        "relationship_type",
        "related_equipment",
        "created_at",
    ]
    list_filter = ["relationship_type", "created_at"]
    search_fields = ["equipment__name", "related_equipment__name", "description"]

    fieldsets = (
        (
            "Relationship",
            {"fields": ("equipment", "relationship_type", "related_equipment")},
        ),
        ("Details", {"fields": ("description",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    readonly_fields = ("created_at", "updated_at")


@admin.register(AssetHistory)
class AssetHistoryAdmin(admin.ModelAdmin):
    """Admin for AssetHistory model (immutable audit trail)."""

    list_display = [
        "equipment",
        "field_name",
        "old_value",
        "new_value",
        "changed_by",
        "changed_at",
    ]
    list_filter = ["field_name", "changed_at", "equipment"]
    search_fields = ["equipment__name", "field_name"]

    fieldsets = (
        (
            "Change Information",
            {"fields": ("equipment", "field_name", "old_value", "new_value")},
        ),
        ("Audit Trail", {"fields": ("changed_by", "changed_at")}),
    )

    readonly_fields = (
        "equipment",
        "field_name",
        "old_value",
        "new_value",
        "changed_by",
        "changed_at",
    )

    def has_add_permission(self, request):
        """Prevent manual creation of history records."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of history records."""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent modification of history records."""
        return False
