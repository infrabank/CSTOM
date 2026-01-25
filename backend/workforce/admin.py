from django.contrib import admin

from .models import EngineerProfile, Schedule, Assignment


@admin.register(EngineerProfile)
class EngineerProfileAdmin(admin.ModelAdmin):
    """Admin interface for EngineerProfile model."""

    list_display = (
        "id",
        "user",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "created_at",
        "updated_at",
    )
    search_fields = (
        "user__username",
        "user__email",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    fieldsets = (
        (
            "Engineer",
            {"fields": ("user",)},
        ),
        (
            "Skills & Specializations",
            {"fields": ("skills", "specializations")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    """Admin interface for Schedule model."""

    list_display = (
        "id",
        "engineer",
        "date",
        "schedule_type",
        "created_at",
    )
    list_filter = (
        "schedule_type",
        "date",
        "created_at",
    )
    search_fields = (
        "engineer__username",
        "engineer__email",
        "notes",
    )
    readonly_fields = ("created_at",)
    fieldsets = (
        (
            "Schedule",
            {"fields": ("engineer", "date", "schedule_type", "notes")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    """Admin interface for Assignment model."""

    list_display = (
        "id",
        "engineer",
        "task",
        "assigned_at",
        "completed_at",
    )
    list_filter = (
        "assigned_at",
        "completed_at",
    )
    search_fields = (
        "engineer__username",
        "engineer__email",
        "task__id",
    )
    readonly_fields = ("assigned_at",)
    fieldsets = (
        (
            "Assignment",
            {"fields": ("engineer", "task", "completed_at")},
        ),
        (
            "Timestamps",
            {
                "fields": ("assigned_at",),
                "classes": ("collapse",),
            },
        ),
    )
