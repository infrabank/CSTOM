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
    SLAEvaluationCriteriaViewSet,
    SLAPenaltyViewSet,
    UptimeRecordViewSet,
    PerformanceImprovementViewSet,
    SLARevisionRequestViewSet,
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
router.register(r"v1/sla/criteria", SLAEvaluationCriteriaViewSet, basename="sla-criteria")
router.register(r"v1/sla/penalties", SLAPenaltyViewSet, basename="sla-penalty")
router.register(r"v1/sla/uptime-records", UptimeRecordViewSet, basename="sla-uptime-record")
router.register(
    r"v1/sla/improvements",
    PerformanceImprovementViewSet,
    basename="sla-improvement",
)
router.register(
    r"v1/sla/revision-requests",
    SLARevisionRequestViewSet,
    basename="sla-revision-request",
)

urlpatterns = [
    path("", include(router.urls)),
]
