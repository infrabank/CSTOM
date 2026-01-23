"""App configuration for equipments."""

from django.apps import AppConfig


class EquipmentsConfig(AppConfig):
    """Configuration for equipments app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "equipments"
    verbose_name = "Equipment Management"
