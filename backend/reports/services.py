"""Report business logic services."""

from datetime import date

from django.db import transaction
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
    @transaction.atomic
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
        task_type_labels = {
            "routine": "정기",
            "incident": "장애",
            "change": "변경",
            "request": "요청",
        }

        lines = [
            f"월간 보고서: {contract.name}",
            f"기간: {period_start} ~ {period_end}",
            f"상태: {contract.get_status_display()}",
            "",
            "작업 요약:",
        ]

        for task_type, count in task_summary.items():
            label = task_type_labels.get(task_type, task_type)
            lines.append(f"  - {label}: {count}건")

        if not task_summary:
            lines.append("  해당 기간 작업 없음")

        lines.extend(
            [
                "",
                "이벤트 요약:",
                f"  - 변경: {changes}건",
                f"  - 장애: {incidents}건",
                f"  - 해결됨: {resolved}건",
            ]
        )

        # Add risk flag status
        risk_flag_labels = {
            "overdue_tasks": "지연 작업",
            "unresolved_incidents": "미해결 장애",
            "pending_approvals": "대기 중 승인",
            "contract_expiring": "계약 만료 임박",
        }
        lines.extend(
            [
                "",
                "위험 현황:",
            ]
        )
        flags = contract.get_risk_flags()
        for flag, value in flags.items():
            label = risk_flag_labels.get(flag, flag.replace("_", " ").title())
            status = "주의" if value else "정상"
            lines.append(f"  - {label}: {status}")

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
            return f"{contract.name}의 {period_start} ~ {period_end} 기간 동안 기록된 장애가 없습니다."

        lines = [
            f"장애 보고서: {contract.name}",
            f"기간: {period_start} ~ {period_end}",
            f"총 장애 건수: {incidents.count()}건",
            "",
        ]

        for incident in incidents:
            lines.extend(
                [
                    f"[{incident.occurred_at.strftime('%Y-%m-%d %H:%M')}] {incident.title}",
                    f"  상태: {'해결됨' if incident.resolved_at else '진행 중'}",
                    f"  고객 통보: {'완료' if incident.customer_notified else '미완료'}",
                ]
            )
            if incident.audit_summary:
                lines.append(f"  요약: {incident.audit_summary[:100]}...")
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

        role_labels = {
            "operator": "운영자",
            "manager": "관리자",
            "admin": "관리자",
            "engineer": "엔지니어",
        }

        lines = [
            f"감사 보고서: {contract.name}",
            f"기간: {period_start} ~ {period_end}",
            f"계약 상태: {contract.get_status_display()}",
            "",
            f"의사결정 기록: {decisions.count()}건",
            "",
        ]

        # Summarize by actor role
        role_counts = decisions.values("actor_role").annotate(count=Count("id"))
        lines.append("역할별 의사결정:")
        for rc in role_counts:
            role = rc["actor_role"]
            label = role_labels.get(role, role.upper())
            lines.append(f"  - {label}: {rc['count']}건")

        # Risk acknowledgment stats
        risk_ack = decisions.filter(risk_acknowledged=True).count()
        alt_considered = decisions.filter(alternatives_considered=True).count()
        lines.extend(
            [
                "",
                "의사결정 품질 지표:",
                f"  - 위험 인지: {risk_ack}/{decisions.count()}건",
                f"  - 대안 검토: {alt_considered}/{decisions.count()}건",
            ]
        )

        # Key decisions with notes
        key_decisions = decisions.exclude(rationale_notes="")[:5]
        if key_decisions:
            lines.extend(["", "주요 의사결정:"])
            for d in key_decisions:
                lines.append(f"  [{d.task.title}] {d.rationale_notes[:100]}...")

        return "\n".join(lines)
