from django.contrib import admin

from .models import SLADefinition, SLAMetric


@admin.register(SLADefinition)
class SLADefinitionAdmin(admin.ModelAdmin):
    """Admin interface for SLA Definitions."""

    list_display = (
        "service_type",
        "contract",
        "priority",
        "target_response_time_minutes",
        "target_resolution_time_minutes",
        "is_active",
        "created_at",
    )
    list_filter = ("priority", "is_active", "contract", "created_at")
    search_fields = ("service_type", "contract__name", "description")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("contract", "service_type", "priority", "description")},
        ),
        (
            "SLA Targets",
            {
                "fields": (
                    "target_response_time_minutes",
                    "target_resolution_time_minutes",
                )
            },
        ),
        ("Status", {"fields": ("is_active",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SLAMetric)
class SLAMetricAdmin(admin.ModelAdmin):
    """Admin interface for SLA Metrics."""

    list_display = (
        "sla_definition",
        "content_object",
        "actual_response_time_minutes",
        "actual_resolution_time_minutes",
        "response_sla_met",
        "resolution_sla_met",
        "created_at",
    )
    list_filter = (
        "response_sla_met",
        "resolution_sla_met",
        "sla_definition__priority",
        "created_at",
    )
    search_fields = (
        "sla_definition__service_type",
        "sla_definition__contract__name",
    )
    readonly_fields = (
        "response_sla_met",
        "resolution_sla_met",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "SLA Definition",
            {"fields": ("sla_definition",)},
        ),
        (
            "Related Object",
            {"fields": ("content_type", "object_id", "content_object")},
        ),
        (
            "Actual Measurements",
            {
                "fields": (
                    "actual_response_time_minutes",
                    "actual_resolution_time_minutes",
                )
            },
        ),
        (
            "SLA Compliance",
            {
                "fields": ("response_sla_met", "resolution_sla_met"),
                "description": "Auto-calculated based on actual vs target times",
            },
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
