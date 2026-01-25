"""Knowledge Base API URLs."""

from rest_framework.routers import DefaultRouter

from .views import KBArticleViewSet, KBCategoryViewSet, KBTemplateViewSet

router = DefaultRouter()
router.register(r"v1/kb/categories", KBCategoryViewSet, basename="kb-category")
router.register(r"v1/kb/articles", KBArticleViewSet, basename="kb-article")
router.register(r"v1/kb/templates", KBTemplateViewSet, basename="kb-template")

urlpatterns = router.urls
