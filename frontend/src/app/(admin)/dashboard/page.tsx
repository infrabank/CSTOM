import Link from "next/link";
import { cookies } from "next/headers";
import {
  ContractListItem,
  EquipmentListItem,
  EventListItem,
  TaskListItem,
} from "@/lib/api";
import Breadcrumb from "@/components/ui/breadcrumb";
import { fetchPaginated } from "@/lib/fetch-paginated";
import DashboardPeriodSection from "./dashboard-period-section";
import type { DashboardSummary } from "./dashboard-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_LABELS: Record<string, string> = {
  "pre-handover": "인수 전",
  handover: "인수",
  stabilization: "안정화",
  steady: "정상 운영",
  closed: "종료",
};

const STATUS_COLORS: Record<string, string> = {
  "pre-handover": "bg-warning-bg text-warning border border-warning-border",
  handover: "bg-info-bg text-info border border-info-border",
  stabilization: "bg-accent-light text-accent",
  steady: "bg-success-bg text-success border border-success-border",
  closed: "bg-surface-sunken text-text-muted",
};

const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  available: "bg-success-bg text-success",
  checked_out: "bg-warning-bg text-warning",
  maintenance: "bg-danger-bg text-danger",
  retired: "bg-surface-sunken text-text-muted",
};

type Period = "today" | "week" | "month" | "quarter";

async function fetchSummary(
  period: Period,
  token?: string,
): Promise<DashboardSummary | null> {
  try {
    const res = await fetch(
      `${API_URL}/v1/dashboard/summary/?period=${period}`,
      {
        next: { revalidate: 30 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as DashboardSummary;
  } catch {
    return null;
  }
}

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { period: periodRaw } = await searchParams;
  const period: Period = (["today", "week", "month", "quarter"] as const).includes(
    periodRaw as Period,
  )
    ? (periodRaw as Period)
    : "week";

  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [contractsPage, equipmentsPage, eventsPage, tasksPage, kpiData] =
    await Promise.all([
      fetchPaginated<ContractListItem>("/v1/contracts/", { token }),
      fetchPaginated<EquipmentListItem>("/v1/equipments/", { token }),
      fetchPaginated<EventListItem>("/v1/events/", { token }),
      fetchPaginated<TaskListItem>("/v1/tasks/", { token }),
      fetchSummary(period, token),
    ]);

  const contracts = contractsPage.results;
  const equipments = equipmentsPage.results;
  const events = eventsPage.results;
  const tasks = tasksPage.results;

  const activeContracts = contracts.filter((c) => c.status !== "closed").length;
  const contractsWithRisks = contracts.filter(
    (c) =>
      c.risk_flags?.pre_env ||
      c.risk_flags?.prior_vendor_coordination ||
      c.risk_flags?.docs_incomplete,
  ).length;
  const availableEquipments = equipments.filter(
    (e) => e.status === "available",
  ).length;
  const checkedOutEquipments = equipments.filter(
    (e) => e.status === "checked_out",
  ).length;
  const recentIncidents = events
    .filter((e) => e.record_type === "incident")
    .slice(0, 5);
  const highImpactTasks = tasks.filter((t) => t.impact_level === "full").length;
  const pendingApprovals = tasks.filter((t) => t.approval_status === "pending");

  return (
    <div>
      <Breadcrumb />

      <DashboardPeriodSection initialPeriod={period} initialKpi={kpiData} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="text-sm font-medium text-text-muted mb-1">활성 사업</div>
          <div className="text-3xl font-bold text-accent">{activeContracts}</div>
          <div className="text-xs text-text-muted mt-1">총 {contracts.length}개 사업</div>
        </div>
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="text-sm font-medium text-text-muted mb-1">리스크 사업</div>
          <div className="text-3xl font-bold text-danger">{contractsWithRisks}</div>
          <div className="text-xs text-text-muted mt-1">주의 필요</div>
        </div>
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="text-sm font-medium text-text-muted mb-1">반출 장비</div>
          <div className="text-3xl font-bold text-warning">{checkedOutEquipments}</div>
          <div className="text-xs text-text-muted mt-1">가용 {availableEquipments}개 / 총 {equipments.length}개</div>
        </div>
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="text-sm font-medium text-text-muted mb-1">고영향 작업</div>
          <div className="text-3xl font-bold text-danger">{highImpactTasks}</div>
          <div className="text-xs text-text-muted mt-1">총 {tasks.length}개 작업</div>
        </div>
        <Link href="/tasks?filter=pending" className="bg-surface rounded-lg shadow-card border border-border-light p-5 hover:shadow-dropdown transition-shadow cursor-pointer">
          <div className="text-sm font-medium text-text-muted mb-1">승인 대기</div>
          <div className={`text-3xl font-bold ${pendingApprovals.length > 0 ? "text-warning" : "text-text-muted"}`}>
            {pendingApprovals.length}
          </div>
          <div className="text-xs text-accent mt-1">클릭하여 확인</div>
        </Link>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-warning-bg border border-warning-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-warning">승인 대기 작업</h2>
            <Link href="/tasks?filter=pending" className="text-accent text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between bg-surface rounded-md p-3 border border-border-light">
                <div>
                  <Link href={`/tasks/${task.id}`} className="font-medium text-accent hover:underline">
                    {task.title}
                  </Link>
                  <div className="text-xs text-text-muted">{task.contract_name}</div>
                </div>
                <Link href={`/tasks/${task.id}`} className="px-3 py-1.5 bg-accent text-text-on-accent text-sm rounded-md hover:bg-accent-hover transition-colors cursor-pointer">
                  승인하기
                </Link>
              </div>
            ))}
          </div>
          {pendingApprovals.length > 3 && (
            <div className="text-center mt-3">
              <span className="text-sm text-warning">외 {pendingApprovals.length - 3}건 더 있음</span>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Contract Status Summary */}
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text">사업 현황</h2>
            <Link href="/contracts" className="text-accent text-sm hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-2">
            {contracts.length === 0 ? (
              <p className="text-text-muted text-center py-4">등록된 사업이 없습니다</p>
            ) : (
              contracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
                  <div>
                    <Link href={`/contracts/${contract.id}`} className="font-medium text-accent hover:underline text-sm">{contract.name}</Link>
                    <div className="text-xs text-text-muted">{contract.client_org}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[contract.status] || "bg-surface-sunken text-text-muted"}`}>
                    {STATUS_LABELS[contract.status] || contract.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text">최근 장애</h2>
            <Link href="/events" className="text-accent text-sm hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-2">
            {recentIncidents.length === 0 ? (
              <p className="text-text-muted text-center py-4">최근 장애가 없습니다</p>
            ) : (
              recentIncidents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
                  <div>
                    <Link href={`/events/${event.id}`} className="font-medium text-accent hover:underline text-sm">{event.title}</Link>
                    <div className="text-xs text-text-muted">{event.contract_name}</div>
                  </div>
                  <span className="text-xs text-text-muted">{new Date(event.occurred_at).toLocaleDateString("ko-KR")}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text">장비 현황</h2>
            <Link href="/equipments" className="text-accent text-sm hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-2">
            {equipments.length === 0 ? (
              <p className="text-text-muted text-center py-4">등록된 장비가 없습니다</p>
            ) : (
              equipments.slice(0, 5).map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
                  <div>
                    <Link href={`/equipments/${equipment.id}`} className="font-medium text-accent hover:underline text-sm">{equipment.name}</Link>
                    <div className="text-xs text-text-muted">{equipment.contract_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EQUIPMENT_STATUS_COLORS[equipment.status] || "bg-surface-sunken text-text-muted"}`}>
                    {equipment.status === "available" ? "가용" : equipment.status === "checked_out" ? "반출" : equipment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-text">최근 작업</h2>
            <Link href="/tasks" className="text-accent text-sm hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-text-muted text-center py-4">등록된 작업이 없습니다</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between py-2.5 border-b border-border-light last:border-0">
                  <div>
                    <Link href={`/tasks/${task.id}`} className="font-medium text-accent hover:underline text-sm">{task.title}</Link>
                    <div className="text-xs text-text-muted">{task.contract_name}</div>
                  </div>
                  {task.impact_level === "full" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-danger-bg text-danger border border-danger-border">
                      고영향
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
