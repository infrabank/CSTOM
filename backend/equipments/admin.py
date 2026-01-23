"""Admin configuration for equipments."""

from django.contrib import admin
from .models import Equipment, EquipmentTransaction


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
        "created_at",
    ]
    list_filter = ["category", "status", "contract"]
    search_fields = ["name", "serial_number", "model_name", "manufacturer"]


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
