"""Knowledge Base API views."""

from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.pagination import StandardPagination

from .models import KBArticle, KBCategory, KBTemplate
from .serializers import (
    KBArticleCreateUpdateSerializer,
    KBArticleDetailSerializer,
    KBArticleListSerializer,
    KBCategorySerializer,
    KBTemplateSerializer,
)


class KBCategoryViewSet(ModelViewSet):
    """ViewSet for KB Category operations."""

    queryset = KBCategory.objects.all()
    serializer_class = KBCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class KBArticleViewSet(ModelViewSet):
    """ViewSet for KB Article operations."""

    queryset = KBArticle.objects.select_related("category", "author").all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "tags"]
    ordering_fields = [
        "title",
        "created_at",
        "updated_at",
        "view_count",
        "helpful_count",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return KBArticleListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return KBArticleCreateUpdateSerializer
        return KBArticleDetailSerializer

    def get_queryset(self):
        """Filter by category and published status if provided."""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        is_published = self.request.query_params.get("is_published")
        if is_published is not None:
            queryset = queryset.filter(is_published=is_published.lower() == "true")

        return queryset

    def perform_create(self, serializer):
        """Set author on article creation."""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def increment_views(self, request, pk=None):
        """Increment view count for an article."""
        article = self.get_object()
        article.view_count += 1
        article.save()
        return Response({"view_count": article.view_count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_helpful(self, request, pk=None):
        """Increment helpful count for an article."""
        article = self.get_object()
        article.helpful_count += 1
        article.save()
        return Response(
            {"helpful_count": article.helpful_count}, status=status.HTTP_200_OK
        )


class KBTemplateViewSet(ModelViewSet):
    """ViewSet for KB Template operations."""

    queryset = KBTemplate.objects.select_related("category").all()
    serializer_class = KBTemplateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "template_content"]
    ordering_fields = ["name", "created_at", "incident_type"]
    ordering = ["name"]

    def get_queryset(self):
        """Filter by category and incident type if provided."""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        incident_type = self.request.query_params.get("incident_type")
        if incident_type:
            queryset = queryset.filter(incident_type=incident_type)

        return queryset
