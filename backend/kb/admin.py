from django.contrib import admin

from .models import KBArticle, KBCategory, KBTemplate


@admin.register(KBCategory)
class KBCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "created_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["name", "description"]
    fieldsets = (
        ("Basic Info", {"fields": ("name", "description")}),
        ("Hierarchy", {"fields": ("parent",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
    readonly_fields = ["created_at", "updated_at"]


@admin.register(KBArticle)
class KBArticleAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "author",
        "view_count",
        "helpful_count",
        "is_published",
        "created_at",
    ]
    list_filter = ["is_published", "category", "created_at", "updated_at"]
    search_fields = ["title", "content", "tags"]
    fieldsets = (
        ("Content", {"fields": ("title", "content", "tags")}),
        ("Organization", {"fields": ("category", "author")}),
        ("Engagement", {"fields": ("view_count", "helpful_count", "is_published")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
    readonly_fields = ["view_count", "helpful_count", "created_at", "updated_at"]


@admin.register(KBTemplate)
class KBTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "incident_type", "category", "created_at"]
    list_filter = ["incident_type", "category", "created_at", "updated_at"]
    search_fields = ["name", "template_content"]
    fieldsets = (
        ("Basic Info", {"fields": ("name", "incident_type")}),
        ("Content", {"fields": ("template_content",)}),
        ("Organization", {"fields": ("category",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
    readonly_fields = ["created_at", "updated_at"]
