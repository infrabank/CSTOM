"""URL routes for reports app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReportViewSet

router = DefaultRouter()
router.register(r"reports", ReportViewSet, basename="report")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "contracts/<int:contract_id>/reports/",
        ReportViewSet.as_view({"get": "list", "post": "create"}),
        name="contract-reports",
    ),
]
