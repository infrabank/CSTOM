"""Inspection app URL configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    InspectionScheduleViewSet,
    InspectionTaskViewSet,
    InspectionResultViewSet,
)

router = DefaultRouter()
router.register(r"v1/inspections/schedules", InspectionScheduleViewSet)
router.register(r"v1/inspections/tasks", InspectionTaskViewSet)
router.register(r"v1/inspections/results", InspectionResultViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
