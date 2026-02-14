"""SLA app URL configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SLADefinitionViewSet,
    SLAMetricViewSet,
    SLACategoryViewSet,
    SLAEvaluationItemViewSet,
    SLAEvaluationReportViewSet,
    SLAEvaluationScoreViewSet,
)

router = DefaultRouter()
router.register(r"v1/sla/definitions", SLADefinitionViewSet, basename="sla-definition")
router.register(r"v1/sla/metrics", SLAMetricViewSet, basename="sla-metric")
router.register(r"v1/sla/categories", SLACategoryViewSet, basename="sla-category")
router.register(
    r"v1/sla/evaluation-items", SLAEvaluationItemViewSet, basename="sla-evaluation-item"
)
router.register(
    r"v1/sla/evaluation-reports",
    SLAEvaluationReportViewSet,
    basename="sla-evaluation-report",
)
router.register(
    r"v1/sla/evaluation-scores",
    SLAEvaluationScoreViewSet,
    basename="sla-evaluation-score",
)

urlpatterns = [
    path("", include(router.urls)),
]
