"""SOP app URL configuration."""

from rest_framework.routers import DefaultRouter

from .views import SOPCategoryViewSet, SOPDocumentViewSet, SOPVersionViewSet

router = DefaultRouter()
router.register(r"v1/sop/categories", SOPCategoryViewSet, basename="sop-category")
router.register(r"v1/sop/documents", SOPDocumentViewSet, basename="sop-document")
router.register(r"v1/sop/versions", SOPVersionViewSet, basename="sop-version")

urlpatterns = router.urls
