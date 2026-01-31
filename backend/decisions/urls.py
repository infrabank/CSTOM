"""URL routes for decisions app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DecisionLogViewSet

router = DefaultRouter()
router.register(r"v1/decisions", DecisionLogViewSet, basename="decision")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "v1/tasks/<int:task_id>/decisions/",
        DecisionLogViewSet.as_view({"get": "list", "post": "create"}),
        name="task-decisions",
    ),
]
