"""Ticket system API views."""

from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Ticket, TicketComment, TicketStatusHistory
from .serializers import (
    TicketCommentSerializer,
    TicketCreateUpdateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    TicketStatusHistorySerializer,
)


class StandardPagination(PageNumberPagination):
    """Standard pagination for Ticket endpoints."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class TicketViewSet(ModelViewSet):
    """ViewSet for Ticket operations."""

    queryset = Ticket.objects.select_related(
        "requester", "assigned_to", "contract", "sla_definition"
    ).all()
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = [
        "title",
        "priority",
        "status",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return TicketListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return TicketCreateUpdateSerializer
        return TicketDetailSerializer

    def get_queryset(self):
        """Filter by role and query parameters."""
        queryset = super().get_queryset()
        user = self.request.user

        # Customers can only see their own tickets
        if user.is_customer():
            queryset = queryset.filter(requester=user)

        # Filter by status if provided
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by priority if provided
        priority_param = self.request.query_params.get("priority")
        if priority_param:
            queryset = queryset.filter(priority=priority_param)

        # Filter by assigned_to if provided
        assigned_to_param = self.request.query_params.get("assigned_to")
        if assigned_to_param:
            queryset = queryset.filter(assigned_to_id=assigned_to_param)

        # Filter by requester if provided (admin/pm only)
        requester_param = self.request.query_params.get("requester")
        if requester_param and not user.is_customer():
            queryset = queryset.filter(requester_id=requester_param)

        return queryset

    def perform_create(self, serializer):
        """Set requester to current user on ticket creation."""
        serializer.save(requester=self.request.user)

    def perform_update(self, serializer):
        """Create status history on ticket update."""
        old_status = self.get_object().status
        instance = serializer.save()
        if instance.status != old_status:
            TicketStatusHistory.objects.create(
                ticket=instance,
                old_status=old_status,
                new_status=instance.status,
                changed_by=self.request.user,
            )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """Add a comment to a ticket."""
        ticket = self.get_object()
        serializer = TicketCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(ticket=ticket, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def history(self, request, pk=None):
        """Get status history for a ticket."""
        ticket = self.get_object()
        history = ticket.status_history.all()
        serializer = TicketStatusHistorySerializer(history, many=True)
        return Response(serializer.data)
