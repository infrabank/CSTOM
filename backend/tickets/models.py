"""Ticketing system models for service desk functionality."""

from django.db import models
from django.contrib.auth import get_user_model

from contracts.models import Contract
from sla.models import SLADefinition

User = get_user_model()


class Ticket(models.Model):
    """Service desk ticket with priority, status, and SLA tracking."""

    PRIORITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    STATUS_CHOICES = [
        ("new", "New"),
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("waiting", "Waiting"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    requester = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="requested_tickets",
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    contract = models.ForeignKey(
        Contract,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    sla_definition = models.ForeignKey(
        SLADefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"

    def __str__(self):
        return f"#{self.id} - {self.title} ({self.get_status_display()})"


class TicketComment(models.Model):
    """Comment on a ticket with internal/external visibility."""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="ticket_comments",
    )
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal comments are not visible to requester",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Ticket Comment"
        verbose_name_plural = "Ticket Comments"

    def __str__(self):
        visibility = "Internal" if self.is_internal else "External"
        return f"Comment on #{self.ticket.id} by {self.author.username} ({visibility})"


class TicketStatusHistory(models.Model):
    """Immutable audit trail of ticket status changes."""

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ticket_status_changes",
    )
    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["changed_at"]
        verbose_name = "Ticket Status History"
        verbose_name_plural = "Ticket Status Histories"

    def __str__(self):
        return f"#{self.ticket.id}: {self.old_status} → {self.new_status} at {self.changed_at}"

    def save(self, *args, **kwargs):
        """Prevent modification of existing records."""
        if self.pk is not None:
            raise ValueError("TicketStatusHistory records are immutable")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Prevent deletion of history records."""
        raise ValueError("TicketStatusHistory records cannot be deleted")
