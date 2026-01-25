"""Django admin configuration for inspection models."""

from django.contrib import admin

from .models import InspectionResult, InspectionSchedule, InspectionTask


@admin.register(InspectionSchedule)
class InspectionScheduleAdmin(admin.ModelAdmin):
    """Admin interface for InspectionSchedule model."""

    list_display = [
        "equipment_type",
        "contract",
        "cycle",
        "assigned_to",
        "is_active",
        "created_at",
    ]
    list_filter = ["cycle", "is_active", "created_at"]
    search_fields = ["equipment_type", "contract__name", "assigned_to__username"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("contract", "equipment_type", "cycle", "assigned_to")},
        ),
        (
            "Details",
            {"fields": ("description", "is_active")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(InspectionTask)
class InspectionTaskAdmin(admin.ModelAdmin):
    """Admin interface for InspectionTask model."""

    list_display = [
        "schedule",
        "scheduled_date",
        "assigned_to",
        "status",
        "created_at",
    ]
    list_filter = ["status", "scheduled_date", "created_at"]
    search_fields = [
        "schedule__equipment_type",
        "assigned_to__username",
        "schedule__contract__name",
    ]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Task Information",
            {"fields": ("schedule", "scheduled_date", "assigned_to", "status")},
        ),
        (
            "Notes",
            {"fields": ("notes",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(InspectionResult)
class InspectionResultAdmin(admin.ModelAdmin):
    """Admin interface for InspectionResult model."""

    list_display = [
        "task",
        "result",
        "completed_by",
        "completed_at",
    ]
    list_filter = ["result", "completed_at"]
    search_fields = [
        "task__schedule__equipment_type",
        "completed_by__username",
        "task__schedule__contract__name",
    ]
    readonly_fields = ["completed_at"]
    fieldsets = (
        (
            "Result Information",
            {"fields": ("task", "result", "completed_by")},
        ),
        (
            "Findings",
            {"fields": ("notes",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("completed_at",),
                "classes": ("collapse",),
            },
        ),
    )
