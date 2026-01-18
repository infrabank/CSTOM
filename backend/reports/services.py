"""Report business logic services."""

from datetime import date

from django.db.models import Count, QuerySet

from common.errors import ResourceNotFoundError
from contracts.models import Contract
from decisions.models import DecisionLog
from events.models import ChangeIncident
from tasks.models import Task

from .models import Report


class ReportService:
    """Service class for report operations."""

    @staticmethod
    def get_all() -> QuerySet[Report]:
        """Get all reports."""
        return Report.objects.select_related("contract").all()

    @staticmethod
    def get_by_contract(contract_id: int) -> QuerySet[Report]:
        """Get reports for a specific contract."""
        return Report.objects.filter(contract_id=contract_id).select_related("contract")

    @staticmethod
    def get_by_id(report_id: int) -> Report:
        """Get a report by ID."""
        try:
            return Report.objects.select_related("contract").get(pk=report_id)
        except Report.DoesNotExist:
            raise ResourceNotFoundError(f"Report with id {report_id} not found")

    @classmethod
    def generate(
        cls,
        contract_id: int,
        report_type: str,
        period_start: date,
        period_end: date,
    ) -> Report:
        """Generate a new report."""
        try:
            contract = Contract.objects.get(pk=contract_id)
        except Contract.DoesNotExist:
            raise ResourceNotFoundError(f"Contract with id {contract_id} not found")

        # Gather data for the report
        summary = cls._generate_summary(contract, report_type, period_start, period_end)

        report = Report.objects.create(
            contract=contract,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            summary=summary,
        )

        return report

    @classmethod
    def _generate_summary(
        cls,
        contract: Contract,
        report_type: str,
        period_start: date,
        period_end: date,
    ) -> str:
        """Generate report summary based on type."""
        if report_type == "monthly":
            return cls._generate_monthly_summary(contract, period_start, period_end)
        elif report_type == "incident":
            return cls._generate_incident_summary(contract, period_start, period_end)
        elif report_type == "audit":
            return cls._generate_audit_summary(contract, period_start, period_end)
        return ""

    @classmethod
    def _generate_monthly_summary(
        cls,
        contract: Contract,
        period_start: date,
        period_end: date,
    ) -> str:
        """Generate monthly report summary."""
        # Count tasks in period
        tasks = Task.objects.filter(
            contract=contract,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        )
        task_counts = tasks.values("task_type").annotate(count=Count("id"))
        task_summary = {t["task_type"]: t["count"] for t in task_counts}

        # Count events in period
        events = ChangeIncident.objects.filter(
            contract=contract,
            occurred_at__date__gte=period_start,
            occurred_at__date__lte=period_end,
        )
        changes = events.filter(record_type="change").count()
        incidents = events.filter(record_type="incident").count()
        resolved = events.exclude(resolved_at=None).count()

        # Build summary
        lines = [
            f"Monthly Report: {contract.name}",
            f"Period: {period_start} to {period_end}",
            f"Status: {contract.get_status_display()}",
            "",
            "Task Summary:",
        ]

        for task_type, count in task_summary.items():
            lines.append(f"  - {task_type.capitalize()}: {count}")

        if not task_summary:
            lines.append("  No tasks in this period")

        lines.extend(
            [
                "",
                "Event Summary:",
                f"  - Changes: {changes}",
                f"  - Incidents: {incidents}",
                f"  - Resolved: {resolved}",
            ]
        )

        # Add risk flag status
        lines.extend(
            [
                "",
                "Risk Status:",
            ]
        )
        flags = contract.get_risk_flags()
        for flag, value in flags.items():
            status = "ACTIVE" if value else "Clear"
            lines.append(f"  - {flag.replace('_', ' ').title()}: {status}")

        return "\n".join(lines)

    @classmethod
    def _generate_incident_summary(
        cls,
        contract: Contract,
        period_start: date,
        period_end: date,
    ) -> str:
        """Generate incident report summary."""
        incidents = ChangeIncident.objects.filter(
            contract=contract,
            record_type="incident",
            occurred_at__date__gte=period_start,
            occurred_at__date__lte=period_end,
        ).order_by("occurred_at")

        if not incidents.exists():
            return f"No incidents recorded for {contract.name} in period {period_start} to {period_end}"

        lines = [
            f"Incident Report: {contract.name}",
            f"Period: {period_start} to {period_end}",
            f"Total Incidents: {incidents.count()}",
            "",
        ]

        for incident in incidents:
            lines.extend(
                [
                    f"[{incident.occurred_at.strftime('%Y-%m-%d %H:%M')}] {incident.title}",
                    f"  Status: {'Resolved' if incident.resolved_at else 'Open'}",
                    f"  Customer Notified: {'Yes' if incident.customer_notified else 'No'}",
                ]
            )
            if incident.audit_summary:
                lines.append(f"  Summary: {incident.audit_summary[:100]}...")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def _generate_audit_summary(
        cls,
        contract: Contract,
        period_start: date,
        period_end: date,
    ) -> str:
        """Generate audit report summary with decision log references."""
        # Get all decision logs in period
        decisions = DecisionLog.objects.filter(
            task__contract=contract,
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        ).select_related("task")

        lines = [
            f"Audit Summary: {contract.name}",
            f"Period: {period_start} to {period_end}",
            f"Contract Status: {contract.get_status_display()}",
            "",
            f"Decision Logs Recorded: {decisions.count()}",
            "",
        ]

        # Summarize by actor role
        role_counts = decisions.values("actor_role").annotate(count=Count("id"))
        lines.append("Decisions by Role:")
        for rc in role_counts:
            lines.append(f"  - {rc['actor_role'].upper()}: {rc['count']}")

        # Risk acknowledgment stats
        risk_ack = decisions.filter(risk_acknowledged=True).count()
        alt_considered = decisions.filter(alternatives_considered=True).count()
        lines.extend(
            [
                "",
                "Decision Quality Metrics:",
                f"  - Risk Acknowledged: {risk_ack}/{decisions.count()}",
                f"  - Alternatives Considered: {alt_considered}/{decisions.count()}",
            ]
        )

        # Key decisions with notes
        key_decisions = decisions.exclude(rationale_notes="")[:5]
        if key_decisions:
            lines.extend(["", "Key Decisions:"])
            for d in key_decisions:
                lines.append(f"  [{d.task.title}] {d.rationale_notes[:100]}...")

        return "\n".join(lines)
