"""AI prediction models for equipment failure forecasting."""

from django.db import models

from equipments.models import Equipment


class PredictionModel(models.Model):
    """AI prediction model configuration and metadata."""

    MODEL_TYPE_CHOICES = [
        ("rule_based", "Rule-Based"),
        ("statistical", "Statistical"),
        ("ml_based", "Machine Learning"),
    ]

    name = models.CharField(max_length=255, verbose_name="Model Name")
    description = models.TextField(blank=True, verbose_name="Description")
    model_type = models.CharField(
        max_length=20, choices=MODEL_TYPE_CHOICES, default="rule_based"
    )
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Prediction Model"
        verbose_name_plural = "Prediction Models"
        indexes = [
            models.Index(fields=["is_active", "-created_at"]),
            models.Index(fields=["model_type"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_model_type_display()})"


class EquipmentMetric(models.Model):
    """Equipment metrics and risk scores for prediction."""

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="metrics",
        verbose_name="Equipment",
    )
    metric_date = models.DateField(db_index=True, verbose_name="Metric Date")
    failure_count = models.PositiveIntegerField(default=0, verbose_name="Failure Count")
    mtbf_hours = models.FloatField(
        default=0.0, verbose_name="Mean Time Between Failures (hours)"
    )
    usage_hours = models.FloatField(default=0.0, verbose_name="Usage Hours")
    risk_score = models.FloatField(
        default=0.0,
        verbose_name="Risk Score (0-100)",
        help_text="Risk score from 0 to 100",
    )
    prediction_model = models.ForeignKey(
        PredictionModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="metrics",
        verbose_name="Prediction Model",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-metric_date"]
        verbose_name = "Equipment Metric"
        verbose_name_plural = "Equipment Metrics"
        indexes = [
            models.Index(fields=["equipment", "-metric_date"]),
            models.Index(fields=["metric_date"]),
            models.Index(fields=["risk_score"]),
        ]
        unique_together = [["equipment", "metric_date"]]

    def __str__(self):
        return f"{self.equipment.name} - {self.metric_date} (Risk: {self.risk_score})"
