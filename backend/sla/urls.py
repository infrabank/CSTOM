"""SLA app URL configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SLADefinitionViewSet, SLAMetricViewSet

router = DefaultRouter()
router.register(r"v1/sla/definitions", SLADefinitionViewSet, basename="sla-definition")
router.register(r"v1/sla/metrics", SLAMetricViewSet, basename="sla-metric")

urlpatterns = [
    path("", include(router.urls)),
]
