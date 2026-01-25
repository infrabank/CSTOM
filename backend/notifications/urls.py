"""Notification system API URLs."""

from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, NotificationPreferenceViewSet

router = DefaultRouter()
router.register(r"v1/notifications", NotificationViewSet, basename="notification")
router.register(
    r"v1/notification-preferences",
    NotificationPreferenceViewSet,
    basename="notification-preference",
)

urlpatterns = router.urls
