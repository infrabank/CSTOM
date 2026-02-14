"""SLA Definition and Metric models for tracking service level agreements."""

from decimal import Decimal

from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator

from contracts.models import Contract
from equipments.models import Equipment


class SLADefinition(models.Model):
    """Service Level Agreement definition tied to a Contract."""

    PRIORITY_CHOICES = [
        ("critical", "Critical"),
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="sla_definitions",
    )
    service_type = models.CharField(
        max_length=255,
        help_text="Type of service (e.g., Incident Response, Change Management)",
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        help_text="Priority level for this SLA",
    )
    target_response_time_minutes = models.PositiveIntegerField(
        help_text="Target response time in minutes"
    )
    target_resolution_time_minutes = models.PositiveIntegerField(
        help_text="Target resolution time in minutes"
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("contract", "service_type", "priority")

    def __str__(self):
        return f"{self.service_type} ({self.get_priority_display()}) - {self.contract.name}"


class SLAMetric(models.Model):
    """Actual SLA metric measurements for tasks or incidents."""

    sla_definition = models.ForeignKey(
        SLADefinition,
        on_delete=models.CASCADE,
        related_name="metrics",
    )

    # Generic foreign key to Task or ChangeIncident
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Actual measurements in minutes
    actual_response_time_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Actual response time in minutes",
    )
    actual_resolution_time_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Actual resolution time in minutes",
    )

    # SLA compliance
    response_sla_met = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether response time SLA was met",
    )
    resolution_sla_met = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether resolution time SLA was met",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["sla_definition", "-created_at"]),
        ]

    def __str__(self):
        return (
            f"SLA Metric for {self.content_object} - {self.sla_definition.service_type}"
        )

    def save(self, *args, **kwargs):
        """Auto-calculate SLA compliance on save."""
        if self.actual_response_time_minutes is not None:
            self.response_sla_met = (
                self.actual_response_time_minutes
                <= self.sla_definition.target_response_time_minutes
            )

        if self.actual_resolution_time_minutes is not None:
            self.resolution_sla_met = (
                self.actual_resolution_time_minutes
                <= self.sla_definition.target_resolution_time_minutes
            )

        super().save(*args, **kwargs)


class SLACategory(models.Model):
    """
    SLA evaluation category (4 main areas: 장애관리, 가동율, 구성관리, 보안관리).

    Categories have weights that must sum to 100% per contract.
    Based on KRIHS (국토연구원) SLA evaluation standard.
    """

    name = models.CharField(
        max_length=100,
        help_text="Category name (e.g., 장애관리, 가동율, 구성관리, 보안관리)",
    )
    code = models.CharField(
        max_length=50,
        unique=False,
        help_text="Category code (e.g., fault_mgmt, availability, config_mgmt, security_mgmt)",
    )
    weight_percent = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Weight percentage (must sum to 100 per contract)",
    )
    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="sla_categories"
    )
    display_order = models.IntegerField(help_text="Order for display purposes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order"]
        unique_together = ("contract", "code")
        verbose_name = "SLA Category"
        verbose_name_plural = "SLA Categories"

    def __str__(self):
        return f"{self.name} ({self.weight_percent}%) - {self.contract.name}"


class SLAEvaluationItem(models.Model):
    """
    Individual evaluation item within an SLA category (14 items total).

    Each item has a weight value used in score calculation: score = weight * service_level.
    """

    MEASUREMENT_CYCLE_CHOICES = [
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("yearly", "Yearly"),
    ]

    category = models.ForeignKey(
        SLACategory, on_delete=models.CASCADE, related_name="items"
    )
    item_number = models.PositiveIntegerField(help_text="Item number (1-14)")
    name = models.CharField(
        max_length=200,
        help_text="Item name (e.g., 장애 발생 건수, 유지보수 적기처리율)",
    )
    weight = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Weight value (the 'a' value in score calculation)",
    )
    measurement_cycle = models.CharField(
        max_length=20, choices=MEASUREMENT_CYCLE_CHOICES, default="monthly"
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["item_number"]
        unique_together = ("category", "item_number")
        verbose_name = "SLA Evaluation Item"
        verbose_name_plural = "SLA Evaluation Items"

    def __str__(self):
        return f"{self.item_number}. {self.name} (weight: {self.weight})"


class SLAEvaluationReport(models.Model):
    """
    Monthly SLA evaluation report with total score and grade.

    Grade is auto-calculated from total_score:
    - S (탁월): 96-100
    - A (우수): 90-95
    - B (보통): 85-89
    - C (최저): 80-84
    - D (불가): 79 or below
    """

    GRADE_CHOICES = [
        ("S", "탁월(S)"),
        ("A", "우수(A)"),
        ("B", "보통(B)"),
        ("C", "최저(C)"),
        ("D", "불가(D)"),
    ]

    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="sla_evaluation_reports"
    )
    evaluation_period_start = models.DateField()
    evaluation_period_end = models.DateField()
    total_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Total evaluation score (sum of all item scores)",
    )
    grade = models.CharField(
        max_length=1,
        choices=GRADE_CHOICES,
        blank=True,
        help_text="Auto-calculated grade based on total_score",
    )
    evaluator_notes = models.TextField(
        blank=True, help_text="Evaluator notes and comments"
    )
    deduction_notes = models.TextField(
        blank=True, help_text="Notes on deduction factors (감점요인 기록)"
    )
    is_finalized = models.BooleanField(
        default=False, help_text="Whether this report is finalized"
    )
    adjustment_points = models.IntegerField(
        default=0, help_text="Bonus/penalty from duplicates and improvements"
    )
    duplicate_incident_count = models.IntegerField(default=0)
    improvement_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-evaluation_period_start"]
        unique_together = (
            "contract",
            "evaluation_period_start",
            "evaluation_period_end",
        )
        verbose_name = "SLA Evaluation Report"
        verbose_name_plural = "SLA Evaluation Reports"

    def __str__(self):
        return f"SLA Report {self.evaluation_period_start} - {self.evaluation_period_end} ({self.contract.name})"

    def calculate_total_score(self):
        """Calculate total score by summing all related scores and set on self."""
        total = self.scores.aggregate(total=models.Sum("score"))["total"]
        self.total_score = total or Decimal("0.00")
        return self.total_score

    def save(self, *args, **kwargs):
        """Auto-calculate grade from total_score on save."""
        if self.total_score is not None:
            score = self.total_score
            if score >= 96:
                self.grade = "S"
            elif score >= 90:
                self.grade = "A"
            elif score >= 85:
                self.grade = "B"
            elif score >= 80:
                self.grade = "C"
            else:
                self.grade = "D"

        super().save(*args, **kwargs)


class SLAEvaluationScore(models.Model):
    """
    Individual item score within an evaluation report.

    Score is auto-calculated: score = evaluation_item.weight * service_level
    where service_level is one of: 1.0, 0.8, 0.6, 0.4, 0.2
    """

    SERVICE_LEVEL_CHOICES = [
        (Decimal("1.0"), "1.0"),
        (Decimal("0.8"), "0.8"),
        (Decimal("0.6"), "0.6"),
        (Decimal("0.4"), "0.4"),
        (Decimal("0.2"), "0.2"),
    ]

    report = models.ForeignKey(
        SLAEvaluationReport, on_delete=models.CASCADE, related_name="scores"
    )
    evaluation_item = models.ForeignKey(
        SLAEvaluationItem, on_delete=models.PROTECT, related_name="scores"
    )
    service_level = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        help_text="Service level (the 'b' value): 1.0, 0.8, 0.6, 0.4, or 0.2",
    )
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Auto-calculated: weight * service_level",
    )
    system_name = models.CharField(
        max_length=200, blank=True, help_text="System name for deduction reference"
    )
    occurrence_date = models.DateField(
        null=True, blank=True, help_text="Date of occurrence (for incidents/issues)"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["evaluation_item__item_number"]
        unique_together = ("report", "evaluation_item")
        verbose_name = "SLA Evaluation Score"
        verbose_name_plural = "SLA Evaluation Scores"

    def __str__(self):
        return f"{self.evaluation_item.name}: {self.score} pts"

    def save(self, *args, **kwargs):
        """Auto-calculate score = evaluation_item.weight * service_level on save."""
        if self.service_level is not None and self.evaluation_item:
            self.score = Decimal(str(self.evaluation_item.weight)) * self.service_level

        super().save(*args, **kwargs)


class SLAEvaluationCriteria(models.Model):
    """Scoring criteria text for each service level per evaluation item."""

    evaluation_item = models.ForeignKey(
        SLAEvaluationItem, on_delete=models.CASCADE, related_name="criteria"
    )
    service_level = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        help_text="Service level: 1.0, 0.8, 0.6, 0.4, 0.2",
    )
    criteria_text = models.TextField(help_text="Description of criteria for this level")

    class Meta:
        unique_together = ("evaluation_item", "service_level")
        ordering = ["evaluation_item__item_number", "-service_level"]
        verbose_name = "SLA Evaluation Criteria"
        verbose_name_plural = "SLA Evaluation Criteria"

    def __str__(self):
        return f"{self.evaluation_item.name} - Level {self.service_level}"


class SLAPenalty(models.Model):
    """Penalty record per evaluation report."""

    PENALTY_TYPE_CHOICES = [
        ("overall", "종합평가 벌점"),
        ("item_level", "항목별 벌점"),
    ]

    report = models.ForeignKey(
        SLAEvaluationReport, on_delete=models.CASCADE, related_name="penalties"
    )
    penalty_type = models.CharField(max_length=20, choices=PENALTY_TYPE_CHOICES)
    evaluation_item = models.ForeignKey(
        SLAEvaluationItem, null=True, blank=True, on_delete=models.SET_NULL
    )
    penalty_rate = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Penalty percentage"
    )
    penalty_amount = models.DecimalField(
        max_digits=12, decimal_places=0, null=True, blank=True
    )
    is_offset = models.BooleanField(
        default=False, help_text="Whether this penalty is offset by annual adjustment"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "SLA Penalty"
        verbose_name_plural = "SLA Penalties"

    def __str__(self):
        return f"{self.get_penalty_type_display()} - {self.penalty_rate}%"


class UptimeRecord(models.Model):
    """Monthly uptime record per equipment."""

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="uptime_records"
    )
    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="uptime_records"
    )
    period_start = models.DateField()
    period_end = models.DateField()
    total_operating_hours = models.DecimalField(max_digits=8, decimal_places=2)
    unplanned_downtime_hours = models.DecimalField(
        max_digits=8, decimal_places=2, default=0
    )
    uptime_percentage = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    downtime_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("equipment", "period_start", "period_end")
        ordering = ["-period_start"]
        verbose_name = "Uptime Record"
        verbose_name_plural = "Uptime Records"

    def __str__(self):
        return f"{self.equipment.name} - {self.period_start} ({self.uptime_percentage}%)"

    def save(self, *args, **kwargs):
        """Auto-calculate uptime_percentage on save."""
        if self.total_operating_hours and self.total_operating_hours > 0:
            effective = self.total_operating_hours - self.unplanned_downtime_hours
            self.uptime_percentage = (effective / self.total_operating_hours) * 100
        super().save(*args, **kwargs)


class PerformanceImprovement(models.Model):
    """Voluntary performance improvement proposal (+1 point each when accepted)."""

    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="performance_improvements"
    )
    title = models.CharField(max_length=300)
    description = models.TextField()
    proposed_by = models.CharField(max_length=100, blank=True)
    proposed_date = models.DateField()
    is_accepted = models.BooleanField(default=False)
    accepted_date = models.DateField(null=True, blank=True)
    effect_report = models.TextField(
        blank=True, help_text="실질개선 효과 결과 보고서"
    )
    evaluation_period_start = models.DateField(null=True, blank=True)
    evaluation_period_end = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-proposed_date"]
        verbose_name = "Performance Improvement"
        verbose_name_plural = "Performance Improvements"

    def __str__(self):
        status = "승인" if self.is_accepted else "제안"
        return f"[{status}] {self.title}"


class SLARevisionRequest(models.Model):
    """SLA revision request workflow (Appendix 2)."""

    REVIEW_RESULT_CHOICES = [
        ("approved", "개정"),
        ("needs_review", "추가검토"),
        ("rejected", "의견반려"),
    ]

    contract = models.ForeignKey(
        Contract, on_delete=models.CASCADE, related_name="sla_revision_requests"
    )
    requester_name = models.CharField(max_length=100)
    requester_department = models.CharField(max_length=100)
    request_date = models.DateField()
    revision_reason = models.TextField()
    document_name = models.CharField(max_length=200, blank=True)
    section_reference = models.CharField(max_length=100, blank=True)
    content_before = models.TextField()
    content_after = models.TextField()
    review_opinion = models.TextField(blank=True)
    review_result = models.CharField(
        max_length=20, choices=REVIEW_RESULT_CHOICES, blank=True
    )
    review_date = models.DateField(null=True, blank=True)
    reviewer_name = models.CharField(max_length=100, blank=True)
    reviewer_department = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-request_date"]
        verbose_name = "SLA Revision Request"
        verbose_name_plural = "SLA Revision Requests"

    def __str__(self):
        return f"SLA 개정요청: {self.revision_reason[:50]} ({self.request_date})"
