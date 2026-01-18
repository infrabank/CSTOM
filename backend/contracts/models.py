"""Contract and ContractStatusHistory models."""

from django.db import models


class Contract(models.Model):
    """Root entity for all records in a business engagement."""

    STATUS_CHOICES = [
        ("pre-handover", "Pre-Handover"),
        ("handover", "Handover"),
        ("stabilization", "Stabilization"),
        ("steady", "Steady State"),
        ("closed", "Closed"),
    ]

    SCOPE_FLAGS = [
        ("ops", "Operations"),
        ("build", "Build"),
        ("transition", "Transition"),
        ("pm", "Project Management"),
    ]

    name = models.CharField(max_length=255)
    client_org = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    contract_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    # Scope flags stored as comma-separated values
    scope_flags = models.CharField(
        max_length=100, blank=True, help_text="Comma-separated: ops,build,transition,pm"
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pre-handover"
    )

    # Risk flags
    risk_pre_env = models.BooleanField(
        default=False, verbose_name="Pre-existing Environment Risk"
    )
    risk_prior_vendor = models.BooleanField(
        default=False, verbose_name="Prior Vendor Coordination Required"
    )
    risk_docs_incomplete = models.BooleanField(
        default=False, verbose_name="Documentation Incomplete"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.client_org})"

    def get_scope_list(self) -> list[str]:
        """Return scope flags as a list."""
        if not self.scope_flags:
            return []
        return [s.strip() for s in self.scope_flags.split(",") if s.strip()]

    def set_scope_list(self, scopes: list[str]):
        """Set scope flags from a list."""
        self.scope_flags = ",".join(scopes)

    def get_risk_flags(self) -> dict:
        """Return risk flags as a dict."""
        return {
            "pre_env": self.risk_pre_env,
            "prior_vendor_coordination": self.risk_prior_vendor,
            "docs_incomplete": self.risk_docs_incomplete,
        }

    def update_status(self, new_status: str, notes: str = ""):
        """Update contract status and create history record."""
        old_status = self.status
        self.status = new_status
        self.save()

        ContractStatusHistory.objects.create(
            contract=self,
            old_status=old_status,
            new_status=new_status,
            notes=notes,
        )


class ContractStatusHistory(models.Model):
    """History of contract status changes."""

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    old_status = models.CharField(max_length=20, choices=Contract.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=Contract.STATUS_CHOICES)
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at"]
        verbose_name_plural = "Contract status histories"

    def __str__(self):
        return f"{self.contract.name}: {self.old_status} -> {self.new_status}"
