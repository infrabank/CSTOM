from django.contrib import admin

from .models import Ticket, TicketComment, TicketStatusHistory


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Admin interface for Ticket model."""

    list_display = (
        "id",
        "title",
        "priority",
        "status",
        "requester",
        "assigned_to",
        "contract",
        "created_at",
    )
    list_filter = (
        "priority",
        "status",
        "created_at",
        "updated_at",
        "contract",
    )
    search_fields = (
        "title",
        "description",
        "requester__username",
        "assigned_to__username",
        "contract__name",
    )
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Ticket Information",
            {"fields": ("title", "description", "priority", "status")},
        ),
        ("Assignment", {"fields": ("requester", "assigned_to", "contract")}),
        ("SLA", {"fields": ("sla_definition",)}),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    """Admin interface for TicketComment model."""

    list_display = (
        "id",
        "ticket",
        "author",
        "is_internal",
        "created_at",
    )
    list_filter = (
        "is_internal",
        "created_at",
        "ticket__priority",
        "ticket__status",
    )
    search_fields = (
        "content",
        "author__username",
        "ticket__title",
    )
    readonly_fields = ("created_at",)
    fieldsets = (
        ("Comment", {"fields": ("ticket", "author", "content", "is_internal")}),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(TicketStatusHistory)
class TicketStatusHistoryAdmin(admin.ModelAdmin):
    """Admin interface for TicketStatusHistory model (read-only)."""

    list_display = (
        "id",
        "ticket",
        "old_status",
        "new_status",
        "changed_by",
        "changed_at",
    )
    list_filter = (
        "new_status",
        "changed_at",
        "ticket__priority",
    )
    search_fields = (
        "ticket__title",
        "changed_by__username",
    )
    readonly_fields = (
        "ticket",
        "old_status",
        "new_status",
        "changed_by",
        "changed_at",
    )

    def has_add_permission(self, request):
        """Prevent manual creation of status history records."""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent modification of status history records."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of status history records."""
        return False
