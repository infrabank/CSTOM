from django.contrib import admin

from .models import (
    SLACategory,
    SLADefinition,
    SLAEvaluationItem,
    SLAEvaluationReport,
    SLAEvaluationScore,
    SLAMetric,
    SLAEvaluationCriteria,
    SLAPenalty,
    UptimeRecord,
    PerformanceImprovement,
    SLARevisionRequest,
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


@admin.register(SLAEvaluationCriteria)
class SLAEvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display = ("evaluation_item", "service_level", "criteria_text")
    list_filter = ("service_level", "evaluation_item__category")
    search_fields = ("criteria_text", "evaluation_item__name")
    ordering = ("evaluation_item__item_number", "-service_level")


@admin.register(SLAPenalty)
class SLAPenaltyAdmin(admin.ModelAdmin):
    list_display = (
        "report",
        "penalty_type",
        "evaluation_item",
        "penalty_rate",
        "penalty_amount",
        "is_offset",
        "created_at",
    )
    list_filter = ("penalty_type", "is_offset", "report__contract")
    search_fields = ("notes", "report__contract__name")
    readonly_fields = ("created_at",)


@admin.register(UptimeRecord)
class UptimeRecordAdmin(admin.ModelAdmin):
    list_display = (
        "equipment",
        "contract",
        "period_start",
        "period_end",
        "total_operating_hours",
        "unplanned_downtime_hours",
        "uptime_percentage",
    )
    list_filter = ("contract", "equipment__category", "period_start")
    search_fields = ("equipment__name", "contract__name")
    readonly_fields = ("uptime_percentage", "created_at", "updated_at")


@admin.register(PerformanceImprovement)
class PerformanceImprovementAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "contract",
        "proposed_by",
        "proposed_date",
        "is_accepted",
        "accepted_date",
    )
    list_filter = ("contract", "is_accepted", "proposed_date")
    search_fields = ("title", "description", "proposed_by")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SLARevisionRequest)
class SLARevisionRequestAdmin(admin.ModelAdmin):
    list_display = (
        "contract",
        "requester_name",
        "request_date",
        "review_result",
        "reviewer_name",
        "review_date",
    )
    list_filter = ("contract", "review_result", "request_date")
    search_fields = (
        "revision_reason",
        "requester_name",
        "document_name",
        "reviewer_name",
    )
    readonly_fields = ("created_at", "updated_at")
