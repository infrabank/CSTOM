from django.contrib import admin

from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model."""

    list_display = (
        "id",
        "recipient",
        "type",
        "title",
        "is_read",
        "created_at",
    )
    list_filter = (
        "type",
        "is_read",
        "created_at",
    )
    search_fields = (
        "title",
        "content",
        "recipient__username",
    )
    readonly_fields = ("created_at",)
    fieldsets = (
        (
            "Notification",
            {"fields": ("recipient", "type", "title", "content", "is_read")},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for NotificationPreference model."""

    list_display = (
        "id",
        "user",
        "email_enabled",
        "in_app_enabled",
    )
    list_filter = (
        "email_enabled",
        "in_app_enabled",
    )
    search_fields = (
        "user__username",
        "user__email",
    )
    fieldsets = (
        (
            "User",
            {"fields": ("user",)},
        ),
        (
            "Preferences",
            {"fields": ("email_enabled", "in_app_enabled", "notification_types")},
        ),
    )
