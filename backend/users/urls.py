"""URL routes for users app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RoleViewSet, UserViewSet

router = DefaultRouter()
router.register(r"v1/users", UserViewSet, basename="user")
router.register(r"v1/roles", RoleViewSet, basename="role")

urlpatterns = [
    path("", include(router.urls)),
]
