"""
URL configuration for cstom project.
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenRefreshView

from common.auth import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    # JWT Auth
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # API routes
    path("api/", include("contracts.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("decisions.urls")),
    path("api/", include("events.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("users.urls")),
    path("api/", include("audit.urls")),
    path("api/", include("equipments.urls")),
    path("api/", include("sop.urls")),
    path("api/", include("inspections.urls")),
    path("api/", include("sla.urls")),
    path("api/", include("kb.urls")),
    path("api/", include("tickets.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("dashboard.urls")),
    path("api/", include("workforce.urls")),
    path("api/", include("predictions.urls")),
]
