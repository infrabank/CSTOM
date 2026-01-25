"""Notification system API views."""

from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class StandardPagination(PageNumberPagination):
    """Standard pagination for Notification endpoints."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationViewSet(ModelViewSet):
    """ViewSet for Notification operations."""

    queryset = Notification.objects.select_related("recipient").all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "type"]
    ordering_fields = ["created_at", "is_read", "type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter to only current user's notifications."""
        queryset = super().get_queryset()
        queryset = queryset.filter(recipient=self.request.user)

        # Filter by type if provided
        notification_type = self.request.query_params.get("type")
        if notification_type:
            queryset = queryset.filter(type=notification_type)

        # Filter by read status if provided
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")

        return queryset

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "marked as read"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        """Get count of unread notifications for current user."""
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user."""
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({"marked_as_read": updated}, status=status.HTTP_200_OK)


class NotificationPreferenceViewSet(ModelViewSet):
    """ViewSet for NotificationPreference operations."""

    queryset = NotificationPreference.objects.select_related("user").all()
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only current user's preference."""
        return NotificationPreference.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_preferences(self, request):
        """Get current user's notification preferences."""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference)
        return Response(serializer.data)

    @action(detail=False, methods=["put"], permission_classes=[IsAuthenticated])
    def update_preferences(self, request):
        """Update current user's notification preferences."""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
