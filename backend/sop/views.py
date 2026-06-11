"""SOP document API views."""

from django.db import transaction
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.pagination import StandardPagination
from common.permissions import ReadOnlyForCustomer

from .models import SOPCategory, SOPDocument, SOPVersion
from .serializers import (
    SOPCategorySerializer,
    SOPDocumentCreateUpdateSerializer,
    SOPDocumentDetailSerializer,
    SOPDocumentListSerializer,
    SOPVersionSerializer,
)


class SOPCategoryViewSet(ModelViewSet):
    """ViewSet for SOP Category operations."""

    queryset = SOPCategory.objects.all()
    serializer_class = SOPCategorySerializer
    permission_classes = [IsAuthenticated, ReadOnlyForCustomer]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]


class SOPVersionViewSet(ModelViewSet):
    """ViewSet for SOP Version operations (read-only)."""

    queryset = SOPVersion.objects.select_related("document", "created_by").all()
    serializer_class = SOPVersionSerializer
    permission_classes = [IsAuthenticated, ReadOnlyForCustomer]
    pagination_class = StandardPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "version_number"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter by document if provided."""
        queryset = super().get_queryset()
        document_id = self.request.query_params.get("document")
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        return queryset

    def create(self, request, *args, **kwargs):
        """Prevent direct version creation."""
        return Response(
            {"detail": "Versions are created automatically when updating documents."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):
        """Prevent version updates (immutable)."""
        return Response(
            {"detail": "Versions are immutable and cannot be updated."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        """Prevent version partial updates."""
        return Response(
            {"detail": "Versions are immutable and cannot be updated."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        """Prevent version deletion."""
        return Response(
            {"detail": "Versions cannot be deleted."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class SOPDocumentViewSet(ModelViewSet):
    """ViewSet for SOP Document operations."""

    queryset = SOPDocument.objects.select_related(
        "category", "author", "current_version"
    ).all()
    permission_classes = [IsAuthenticated, ReadOnlyForCustomer]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "category__name"]
    ordering_fields = ["title", "created_at", "updated_at"]
    ordering = ["-updated_at"]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return SOPDocumentListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return SOPDocumentCreateUpdateSerializer
        return SOPDocumentDetailSerializer

    def get_queryset(self):
        """Filter by category if provided."""
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        """Set author on document creation."""
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        """Update document and create new version if content changed."""
        document = serializer.save()
        # Version creation is handled separately via the version endpoint
        # This just updates the document metadata

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated, ReadOnlyForCustomer],
    )
    def create_version(self, request, pk=None):
        """Create a new version of the document."""
        document = self.get_object()
        content = request.data.get("content")

        if not content:
            return Response(
                {"detail": "Content is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get next version number
        last_version = document.versions.order_by("-version_number").first()
        next_version_number = (last_version.version_number + 1) if last_version else 1

        with transaction.atomic():
            # Create new version
            version = SOPVersion.objects.create(
                document=document,
                version_number=next_version_number,
                content=content,
                created_by=request.user,
            )

            # Update current version
            document.current_version = version
            document.save()

        serializer = SOPVersionSerializer(version)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
