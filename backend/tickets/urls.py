"""Ticket system API URLs."""

from rest_framework.routers import DefaultRouter

from .views import TicketViewSet

router = DefaultRouter()
router.register(r"v1/tickets", TicketViewSet, basename="ticket")

urlpatterns = router.urls
