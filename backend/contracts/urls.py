"""URL routes for contracts app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContractViewSet

router = DefaultRouter()
router.register(r"v1/contracts", ContractViewSet, basename="contract")

urlpatterns = [
    path("", include(router.urls)),
]
