"""URL routes for workforce app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EngineerProfileViewSet, ScheduleViewSet

router = DefaultRouter()
router.register(r"v1/workforce/engineers", EngineerProfileViewSet, basename="engineer")
router.register(r"v1/workforce/schedules", ScheduleViewSet, basename="schedule")

urlpatterns = [
    path("", include(router.urls)),
]
