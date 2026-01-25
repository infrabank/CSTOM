"""SOP (Standard Operating Procedure) document models with version control."""

from django.db import models
from django.core.exceptions import ValidationError

from users.models import User


class SOPCategory(models.Model):
    """Hierarchical category for organizing SOPs."""

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
        verbose_name_plural = "SOP Categories"

    def __str__(self):
        return self.name


class SOPDocument(models.Model):
    """Standard Operating Procedure document with version history."""

    title = models.CharField(max_length=300)
    category = models.ForeignKey(
        SOPCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sop_documents",
    )
    current_version = models.OneToOneField(
        "SOPVersion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="document_current",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        version_num = (
            self.current_version.version_number
            if self.current_version
            else "No version"
        )
        return f"{self.title} (v{version_num})"


class SOPVersion(models.Model):
    """Immutable version history for SOP documents."""

    document = models.ForeignKey(
        SOPDocument,
        on_delete=models.CASCADE,
        related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    content = models.TextField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sop_versions_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("document", "version_number")

    def __str__(self):
        return f"{self.document.title} v{self.version_number}"

    def save(self, *args, **kwargs):
        """Prevent updates to existing versions (immutable)."""
        if self.pk:
            raise ValidationError(
                "SOPVersion records are immutable and cannot be modified."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion of versions."""
        raise ValidationError("SOPVersion records cannot be deleted.")
