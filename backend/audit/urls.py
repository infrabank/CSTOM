"""URL routes for audit app."""

from django.urls import path

from .views import AuditEventListView

urlpatterns = [
    path("v1/audit/events/", AuditEventListView.as_view(), name="audit-event-list"),
]
