"""
URL configuration for cstom project.
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    # JWT Auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # API routes
    path("api/", include("contracts.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("decisions.urls")),
    path("api/", include("events.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("users.urls")),
    path("api/", include("audit.urls")),
]
