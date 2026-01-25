"""Workforce management models for engineer profiles, schedules, and task assignments."""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class EngineerProfile(models.Model):
    """Engineer profile with skills and specializations."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="engineer_profile",
    )
    skills = models.JSONField(
        default=list,
        help_text="List of engineer skills",
    )
    specializations = models.JSONField(
        default=list,
        help_text="List of engineer specializations",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Engineer Profile"
        verbose_name_plural = "Engineer Profiles"

    def __str__(self):
        return f"Engineer Profile - {self.user.username}"


class Schedule(models.Model):
    """Engineer schedule with type and notes."""

    SCHEDULE_TYPE_CHOICES = [
        ("work", "Work"),
        ("vacation", "Vacation"),
        ("training", "Training"),
        ("sick_leave", "Sick Leave"),
        ("other", "Other"),
    ]

    engineer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="schedules",
    )
    date = models.DateField(db_index=True)
    schedule_type = models.CharField(
        max_length=20,
        choices=SCHEDULE_TYPE_CHOICES,
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-date"]
        verbose_name = "Schedule"
        verbose_name_plural = "Schedules"
        indexes = [
            models.Index(fields=["engineer", "-date"]),
            models.Index(fields=["engineer", "schedule_type"]),
        ]

    def __str__(self):
        return f"{self.engineer.username} - {self.get_schedule_type_display()} ({self.date})"


class Assignment(models.Model):
    """Task assignment to engineer with completion tracking."""

    engineer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    assigned_at = models.DateTimeField(auto_now_add=True, db_index=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-assigned_at"]
        verbose_name = "Assignment"
        verbose_name_plural = "Assignments"
        indexes = [
            models.Index(fields=["engineer", "-assigned_at"]),
            models.Index(fields=["task", "-assigned_at"]),
        ]

    def __str__(self):
        return f"{self.engineer.username} - Task {self.task.id}"
