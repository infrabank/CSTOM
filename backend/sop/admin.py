"""Django admin configuration for SOP models."""

from django.contrib import admin

from .models import SOPCategory, SOPDocument, SOPVersion


@admin.register(SOPCategory)
class SOPCategoryAdmin(admin.ModelAdmin):
    """Admin interface for SOP categories."""

    list_display = ("name", "parent", "created_at")
    list_filter = ("created_at", "parent")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(SOPDocument)
class SOPDocumentAdmin(admin.ModelAdmin):
    """Admin interface for SOP documents."""

    list_display = ("title", "category", "author", "current_version", "created_at")
    list_filter = ("category", "created_at", "author")
    search_fields = ("title", "category__name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Document Info", {"fields": ("title", "category", "author")}),
        ("Version", {"fields": ("current_version",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(SOPVersion)
class SOPVersionAdmin(admin.ModelAdmin):
    """Admin interface for SOP versions."""

    list_display = ("document", "version_number", "created_by", "created_at")
    list_filter = ("document", "created_at", "created_by")
    search_fields = ("document__title", "content")
    readonly_fields = (
        "created_at",
        "document",
        "version_number",
        "created_by",
        "content",
    )

    def has_add_permission(self, request):
        """Disable adding versions through admin (use document creation flow)."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of versions."""
        return False

    def has_change_permission(self, request, obj=None):
        """Prevent editing of versions (immutable)."""
        return False
