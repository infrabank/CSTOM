"""URL configuration for equipments app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EquipmentViewSet

router = DefaultRouter()
router.register(r"v1/equipments", EquipmentViewSet, basename="equipment")

urlpatterns = [
    path("", include(router.urls)),
]
