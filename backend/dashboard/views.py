"""Dashboard API views."""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import get_dashboard_summary


class DashboardSummaryView(APIView):
    """API view for dashboard summary with KPI calculations."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get dashboard summary with KPIs.

        Query Parameters:
            period: 'today', 'week', 'month', 'quarter' (default: 'week')

        Returns:
            {
                "sla_compliance_rate": float,
                "mttr_hours": float,
                "inspection_completion_rate": float,
                "task_summary": {
                    "pending": int,
                    "in_progress": int,
                    "completed": int
                },
                "period": str,
                "start_date": str (ISO format),
                "end_date": str (ISO format)
            }
        """
        period = request.query_params.get("period", "week")

        # Validate period
        valid_periods = ["today", "week", "month", "quarter"]
        if period not in valid_periods:
            period = "week"

        summary = get_dashboard_summary(period)
        return Response(summary)
