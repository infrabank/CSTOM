"""Tests for dashboard KPI calculation services."""

from datetime import date, timedelta

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.utils import timezone

from contracts.models import Contract
from events.models import ChangeIncident
from inspections.models import InspectionSchedule, InspectionTask
from sla.models import SLADefinition, SLAMetric
from users.models import User

from .services import (
    calculate_inspection_completion_rate,
    calculate_mttr,
    calculate_sla_compliance_rate,
    get_period_dates,
    get_task_status_summary,
)


class GetPeriodDatesTest(TestCase):
    """Test period date calculation."""

    def test_today_starts_at_midnight(self):
        start, end = get_period_dates("today")
        self.assertEqual(start.hour, 0)
        self.assertEqual(start.minute, 0)
        self.assertEqual(start.second, 0)

    def test_week_spans_7_days(self):
        start, end = get_period_dates("week")
        diff = (end - start).days
        self.assertEqual(diff, 7)

    def test_month_spans_30_days(self):
        start, end = get_period_dates("month")
        diff = (end - start).days
        self.assertEqual(diff, 30)

    def test_quarter_spans_90_days(self):
        start, end = get_period_dates("quarter")
        diff = (end - start).days
        self.assertEqual(diff, 90)

    def test_unknown_defaults_to_week(self):
        start_unknown, end_unknown = get_period_dates("unknown")
        start_week, end_week = get_period_dates("week")
        diff_unknown = (end_unknown - start_unknown).days
        diff_week = (end_week - start_week).days
        self.assertEqual(diff_unknown, diff_week)


class CalculateSlaComplianceRateTest(TestCase):
    """Test SLA compliance rate calculation."""

    def setUp(self):
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        self.sla_def = SLADefinition.objects.create(
            contract=self.contract,
            service_type="Incident Response",
            priority="critical",
            target_response_time_minutes=60,
            target_resolution_time_minutes=240,
        )
        self.ct = ContentType.objects.get_for_model(Contract)
        self.start = timezone.now() - timedelta(days=7)
        self.end = timezone.now() + timedelta(minutes=1)

    def _create_metric(self, response_met, resolution_met):
        """Create SLAMetric without triggering auto-calculation."""
        SLAMetric.objects.create(
            sla_definition=self.sla_def,
            content_type=self.ct,
            object_id=self.contract.pk,
            response_sla_met=response_met,
            resolution_sla_met=resolution_met,
        )

    def test_no_metrics_returns_zero(self):
        rate = calculate_sla_compliance_rate(self.start, self.end)
        self.assertEqual(rate, 0.0)

    def test_all_met(self):
        for _ in range(5):
            self._create_metric(True, True)
        rate = calculate_sla_compliance_rate(self.start, self.end)
        self.assertEqual(rate, 100.0)

    def test_none_met(self):
        for _ in range(5):
            self._create_metric(False, False)
        rate = calculate_sla_compliance_rate(self.start, self.end)
        self.assertEqual(rate, 0.0)

    def test_partial_compliance(self):
        # 3 with response met (response OR resolution), 2 with neither
        for _ in range(3):
            self._create_metric(True, False)
        for _ in range(2):
            self._create_metric(False, False)
        rate = calculate_sla_compliance_rate(self.start, self.end)
        self.assertEqual(rate, 60.0)


class CalculateMttrTest(TestCase):
    """Test MTTR calculation."""

    def setUp(self):
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        self.start = timezone.now() - timedelta(days=7)
        self.end = timezone.now() + timedelta(minutes=1)

    def test_no_incidents_returns_zero(self):
        mttr = calculate_mttr(self.start, self.end)
        self.assertEqual(mttr, 0.0)

    def test_unresolved_incidents_excluded(self):
        ChangeIncident.objects.create(
            contract=self.contract,
            record_type="incident",
            title="Unresolved",
            occurred_at=timezone.now() - timedelta(hours=2),
            resolved_at=None,
        )
        mttr = calculate_mttr(self.start, self.end)
        self.assertEqual(mttr, 0.0)

    def test_single_resolved_incident(self):
        occurred = timezone.now() - timedelta(hours=6)
        resolved = occurred + timedelta(hours=3)
        ChangeIncident.objects.create(
            contract=self.contract,
            record_type="incident",
            title="Resolved",
            occurred_at=occurred,
            resolved_at=resolved,
        )
        mttr = calculate_mttr(self.start, self.end)
        self.assertEqual(mttr, 3.0)

    def test_average_of_multiple_incidents(self):
        now = timezone.now()
        # Incident 1: 2 hours
        ChangeIncident.objects.create(
            contract=self.contract,
            record_type="incident",
            title="Inc 1",
            occurred_at=now - timedelta(hours=4),
            resolved_at=now - timedelta(hours=2),
        )
        # Incident 2: 4 hours
        ChangeIncident.objects.create(
            contract=self.contract,
            record_type="incident",
            title="Inc 2",
            occurred_at=now - timedelta(hours=6),
            resolved_at=now - timedelta(hours=2),
        )
        mttr = calculate_mttr(self.start, self.end)
        self.assertEqual(mttr, 3.0)

    def test_change_records_excluded(self):
        occurred = timezone.now() - timedelta(hours=2)
        ChangeIncident.objects.create(
            contract=self.contract,
            record_type="change",
            title="Not incident",
            occurred_at=occurred,
            resolved_at=occurred + timedelta(hours=1),
        )
        mttr = calculate_mttr(self.start, self.end)
        self.assertEqual(mttr, 0.0)


class CalculateInspectionCompletionRateTest(TestCase):
    """Test inspection completion rate."""

    def setUp(self):
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        self.user = User.objects.create_user(
            username="inspector",
            email="inspector@test.com",
            password="pass123",
        )
        self.schedule = InspectionSchedule.objects.create(
            contract=self.contract,
            equipment_type="Server",
            cycle="monthly",
            assigned_to=self.user,
        )
        self.start = timezone.now() - timedelta(days=7)
        self.end = timezone.now() + timedelta(minutes=1)

    def test_no_tasks_returns_zero(self):
        rate = calculate_inspection_completion_rate(self.start, self.end)
        self.assertEqual(rate, 0.0)

    def test_all_completed(self):
        for i in range(3):
            InspectionTask.objects.create(
                schedule=self.schedule,
                scheduled_date=date.today() - timedelta(days=i),
                assigned_to=self.user,
                status="completed",
            )
        rate = calculate_inspection_completion_rate(self.start, self.end)
        self.assertEqual(rate, 100.0)

    def test_partial_completion(self):
        today = date.today()
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today,
            assigned_to=self.user,
            status="completed",
        )
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today - timedelta(days=1),
            assigned_to=self.user,
            status="pending",
        )
        rate = calculate_inspection_completion_rate(self.start, self.end)
        self.assertEqual(rate, 50.0)


class GetTaskStatusSummaryTest(TestCase):
    """Test task status summary."""

    def setUp(self):
        self.contract = Contract.objects.create(
            name="Test Contract",
            client_org="Test Org",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
        )
        self.user = User.objects.create_user(
            username="inspector",
            email="inspector@test.com",
            password="pass123",
        )
        self.schedule = InspectionSchedule.objects.create(
            contract=self.contract,
            equipment_type="Server",
            cycle="monthly",
            assigned_to=self.user,
        )
        self.start = timezone.now() - timedelta(days=7)
        self.end = timezone.now() + timedelta(minutes=1)

    def test_empty_returns_zeros(self):
        summary = get_task_status_summary(self.start, self.end)
        self.assertEqual(summary["total"], 0)
        self.assertEqual(summary["pending"], 0)
        self.assertEqual(summary["in_progress"], 0)
        self.assertEqual(summary["completed"], 0)

    def test_counts_by_status(self):
        today = date.today()
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today,
            assigned_to=self.user,
            status="pending",
        )
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today - timedelta(days=1),
            assigned_to=self.user,
            status="in_progress",
        )
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today - timedelta(days=2),
            assigned_to=self.user,
            status="completed",
        )
        InspectionTask.objects.create(
            schedule=self.schedule,
            scheduled_date=today - timedelta(days=3),
            assigned_to=self.user,
            status="completed",
        )
        summary = get_task_status_summary(self.start, self.end)
        self.assertEqual(summary["total"], 4)
        self.assertEqual(summary["pending"], 1)
        self.assertEqual(summary["in_progress"], 1)
        self.assertEqual(summary["completed"], 2)
