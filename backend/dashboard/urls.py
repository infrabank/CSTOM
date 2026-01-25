"""Dashboard API URLs."""

from django.urls import path

from .views import DashboardSummaryView

urlpatterns = [
    path(
        "v1/dashboard/summary/",
        DashboardSummaryView.as_view(),
        name="dashboard-summary",
    ),
]
