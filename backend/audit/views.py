"""Audit event API views."""

from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination

from common.permissions import IsPMOrAdmin

from .models import AuditEvent
from .serializers import AuditEventSerializer


class AuditEventPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


class AuditEventListView(ListAPIView):
    """List audit events (PM/Admin only). Read-only, append-only audit trail."""

    serializer_class = AuditEventSerializer
    permission_classes = [IsPMOrAdmin]
    pagination_class = AuditEventPagination

    def get_queryset(self):
        queryset = AuditEvent.objects.select_related("actor").all()

        # Filter by entity type
        entity_type = self.request.query_params.get("entity_type")
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)

        # Filter by action type
        action_type = self.request.query_params.get("action_type")
        if action_type:
            queryset = queryset.filter(action_type=action_type)

        # Filter by actor
        actor_id = self.request.query_params.get("actor")
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)

        # Filter by entity ID
        entity_id = self.request.query_params.get("entity_id")
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)

        # Filter by date range
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(occurred_at__date__gte=date_from)

        date_to = self.request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(occurred_at__date__lte=date_to)

        return queryset
