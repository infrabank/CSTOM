"""URL routes for tasks app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet

router = DefaultRouter()
router.register(r"v1/tasks", TaskViewSet, basename="task")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "v1/contracts/<int:contract_id>/tasks/",
        TaskViewSet.as_view({"get": "list", "post": "create"}),
        name="contract-tasks",
    ),
]
