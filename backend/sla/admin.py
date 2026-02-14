from django.contrib import admin

from .models import (
    SLACategory,
    SLADefinition,
    SLAEvaluationItem,
    SLAEvaluationReport,
    SLAEvaluationScore,
    SLAMetric,
)


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


@admin.register(SLACategory)
class SLACategoryAdmin(admin.ModelAdmin):
    """Admin interface for SLA Categories."""

    list_display = (
        "name",
        "code",
        "weight_percent",
        "contract",
        "display_order",
        "is_active",
    )
    list_filter = ("contract", "is_active")
    search_fields = ("name", "code", "contract__name")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("display_order",)


@admin.register(SLAEvaluationItem)
class SLAEvaluationItemAdmin(admin.ModelAdmin):
    """Admin interface for SLA Evaluation Items."""

    list_display = (
        "item_number",
        "name",
        "category",
        "weight",
        "measurement_cycle",
        "is_active",
    )
    list_filter = ("category", "measurement_cycle", "is_active")
    search_fields = ("name", "category__name")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("item_number",)


@admin.register(SLAEvaluationReport)
class SLAEvaluationReportAdmin(admin.ModelAdmin):
    """Admin interface for SLA Evaluation Reports."""

    list_display = (
        "contract",
        "evaluation_period_start",
        "evaluation_period_end",
        "total_score",
        "grade",
        "is_finalized",
        "created_at",
    )
    list_filter = ("contract", "grade", "is_finalized", "evaluation_period_start")
    search_fields = ("contract__name", "evaluator_notes")
    readonly_fields = ("total_score", "grade", "created_at", "updated_at")
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "contract",
                    "evaluation_period_start",
                    "evaluation_period_end",
                )
            },
        ),
        (
            "Scores",
            {"fields": ("total_score", "grade")},
        ),
        (
            "Notes",
            {"fields": ("evaluator_notes", "deduction_notes")},
        ),
        (
            "Status",
            {"fields": ("is_finalized",)},
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SLAEvaluationScore)
class SLAEvaluationScoreAdmin(admin.ModelAdmin):
    """Admin interface for SLA Evaluation Scores."""

    list_display = (
        "report",
        "evaluation_item",
        "service_level",
        "score",
        "system_name",
        "occurrence_date",
    )
    list_filter = ("report__contract", "service_level", "evaluation_item__category")
    search_fields = ("evaluation_item__name", "system_name", "notes")
    readonly_fields = ("score", "created_at", "updated_at")


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
