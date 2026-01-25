from django.contrib import admin

from .models import EquipmentMetric, PredictionModel


@admin.register(PredictionModel)
class PredictionModelAdmin(admin.ModelAdmin):
    """Admin interface for PredictionModel."""

    list_display = (
        "id",
        "name",
        "model_type",
        "is_active",
        "created_at",
    )
    list_filter = (
        "model_type",
        "is_active",
        "created_at",
    )
    search_fields = (
        "name",
        "description",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "Model Information",
            {"fields": ("name", "description", "model_type", "is_active")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(EquipmentMetric)
class EquipmentMetricAdmin(admin.ModelAdmin):
    """Admin interface for EquipmentMetric."""

    list_display = (
        "id",
        "equipment",
        "metric_date",
        "risk_score",
        "failure_count",
        "mtbf_hours",
        "created_at",
    )
    list_filter = (
        "metric_date",
        "risk_score",
        "equipment__category",
        "prediction_model",
    )
    search_fields = (
        "equipment__name",
        "equipment__serial_number",
    )
    readonly_fields = ("created_at",)
    fieldsets = (
        (
            "Equipment",
            {"fields": ("equipment", "metric_date")},
        ),
        (
            "Metrics",
            {
                "fields": (
                    "failure_count",
                    "mtbf_hours",
                    "usage_hours",
                    "risk_score",
                )
            },
        ),
        (
            "Prediction",
            {"fields": ("prediction_model",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )
