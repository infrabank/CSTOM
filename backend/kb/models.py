"""Knowledge Base models for troubleshooting articles and templates."""

from django.db import models

from users.models import User


class KBCategory(models.Model):
    """Hierarchical category for organizing KB articles."""

    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "KB Categories"

    def __str__(self):
        return self.name


class KBArticle(models.Model):
    """Knowledge Base article for troubleshooting and documentation."""

    title = models.CharField(max_length=300)
    content = models.TextField(help_text="Markdown formatted content")
    category = models.ForeignKey(
        KBCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="kb_articles",
    )
    tags = models.CharField(
        max_length=500,
        blank=True,
        help_text="Comma-separated tags for search and filtering",
    )
    view_count = models.PositiveIntegerField(default=0)
    helpful_count = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class KBTemplate(models.Model):
    """Template for incident troubleshooting procedures."""

    INCIDENT_TYPES = [
        ("hardware_failure", "Hardware Failure"),
        ("software_error", "Software Error"),
        ("network_issue", "Network Issue"),
        ("security_incident", "Security Incident"),
        ("performance_degradation", "Performance Degradation"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=300)
    category = models.ForeignKey(
        KBCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="templates",
    )
    template_content = models.TextField(
        help_text="Markdown template for troubleshooting"
    )
    incident_type = models.CharField(
        max_length=50,
        choices=INCIDENT_TYPES,
        default="other",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_incident_type_display()})"
