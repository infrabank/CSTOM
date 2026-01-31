"""URL routes for events app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChangeIncidentViewSet

router = DefaultRouter()
router.register(r"v1/events", ChangeIncidentViewSet, basename="event")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "v1/contracts/<int:contract_id>/events/",
        ChangeIncidentViewSet.as_view({"get": "list", "post": "create"}),
        name="contract-events",
    ),
]
