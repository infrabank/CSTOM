"""URL configuration for predictions app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AtRiskEquipmentView, EquipmentMetricViewSet, PredictionModelViewSet

router = DefaultRouter()
router.register(
    r"v1/predictions/models", PredictionModelViewSet, basename="prediction-model"
)
router.register(
    r"v1/predictions/metrics", EquipmentMetricViewSet, basename="equipment-metric"
)

urlpatterns = [
    path(
        "v1/predictions/at-risk/",
        AtRiskEquipmentView.as_view(),
        name="at-risk-equipment",
    ),
    path("", include(router.urls)),
]
