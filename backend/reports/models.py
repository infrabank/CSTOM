"""Report model for generated reports."""

import hashlib

from django.db import models

from contracts.models import Contract


class Report(models.Model):
    """Generated output for monthly, incident, and audit reporting."""

    REPORT_TYPES = [
        ("monthly", "Monthly Report"),
        ("incident", "Incident Report"),
        ("audit", "Audit Report"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    period_start = models.DateField()
    period_end = models.DateField()
    generated_at = models.DateTimeField(auto_now_add=True)
    summary = models.TextField(blank=True)
    integrity_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.contract.name} ({self.period_start} to {self.period_end})"

    def generate_integrity_hash(self) -> str:
        """Generate SHA-256 hash of report content for audit integrity."""
        content = f"{self.contract_id}|{self.report_type}|{self.period_start}|{self.period_end}|{self.summary}"
        return hashlib.sha256(content.encode()).hexdigest()

    def save(self, *args, **kwargs):
        if not self.integrity_hash:
            self.integrity_hash = self.generate_integrity_hash()
        super().save(*args, **kwargs)
