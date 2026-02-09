'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import Breadcrumb from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardCharts = dynamic(() => import("@/components/dashboard-charts"), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface DashboardSummary {
  sla_compliance_rate: number;
  mttr_hours: number;
  inspection_completion_rate: number;
  task_summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}

interface ContractListItem {
  id: number;
  name: string;
  client_org: string;
  status: string;
  risk_flags: {
    pre_env: boolean;
    prior_vendor_coordination: boolean;
    docs_incomplete: boolean;
  };
}

interface EquipmentListItem {
  id: number;
  name: string;
  status: string;
  contract_name: string;
}

interface EventListItem {
  id: number;
  title: string;
  record_type: string;
  contract_name: string;
  occurred_at: string;
}

interface TaskListItem {
  id: number;
  title: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  approval_status: string;
  contract_name: string;
}

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

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<DashboardSummary | null>(null);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [equipments, setEquipments] = useState<EquipmentListItem[]>([]);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();

        const [kpiRes, contractsRes, equipmentsRes, eventsRes, tasksRes] = await Promise.all([
          fetch(`${API_URL}/v1/dashboard/summary/?period=${period}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/v1/contracts/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/v1/equipments/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/v1/events/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/v1/tasks/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (kpiRes.ok) {
          const kpiJson = await kpiRes.json();
          setKpiData(kpiJson);
        }
        if (contractsRes.ok) {
          const contractsJson = await contractsRes.json();
          setContracts(contractsJson.results || []);
        }
        if (equipmentsRes.ok) {
          const equipmentsJson = await equipmentsRes.json();
          setEquipments(equipmentsJson.results || []);
        }
        if (eventsRes.ok) {
          const eventsJson = await eventsRes.json();
          setEvents(eventsJson.results || []);
        }
        if (tasksRes.ok) {
          const tasksJson = await tasksRes.json();
          setTasks(tasksJson.results || []);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  const activeContracts = contracts.filter((c) => c.status !== "closed").length;
  const contractsWithRisks = contracts.filter(
    (c) =>
      c.risk_flags?.pre_env ||
      c.risk_flags?.prior_vendor_coordination ||
      c.risk_flags?.docs_incomplete
  ).length;
  const availableEquipments = equipments.filter((e) => e.status === "available").length;
  const checkedOutEquipments = equipments.filter((e) => e.status === "checked_out").length;
  const recentIncidents = events.filter((e) => e.record_type === "incident").slice(0, 5);
  const highImpactTasks = tasks.filter((t) => t.impact_level === "full").length;
  const pendingApprovals = tasks.filter((t) => t.approval_status === "pending");

  const taskChartData = kpiData ? [
    { name: '대기', value: kpiData.task_summary.pending },
    { name: '진행중', value: kpiData.task_summary.in_progress },
    { name: '완료', value: kpiData.task_summary.completed },
  ] : [];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-sunken rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface rounded-lg shadow-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text">대시보드</h1>
        <div className="flex gap-1.5 bg-surface-sunken rounded-lg p-1">
          {(['today', 'week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                period === p
                  ? 'bg-accent text-text-on-accent shadow-card'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover'
              }`}
            >
              {p === 'today' ? '오늘' : p === 'week' ? '주간' : p === 'month' ? '월간' : '분기'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-success">
            <div className="text-sm font-medium text-text-muted mb-1">SLA 준수율</div>
            <div className={`text-3xl font-bold ${kpiData.sla_compliance_rate >= 90 ? 'text-success' : kpiData.sla_compliance_rate >= 70 ? 'text-warning' : 'text-danger'}`}>
              {kpiData.sla_compliance_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-text-muted mt-1">목표: 90% 이상</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-info">
            <div className="text-sm font-medium text-text-muted mb-1">평균 복구 시간 (MTTR)</div>
            <div className="text-3xl font-bold text-info">
              {kpiData.mttr_hours.toFixed(1)}h
            </div>
            <div className="text-xs text-text-muted mt-1">시간 단위</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-accent">
            <div className="text-sm font-medium text-text-muted mb-1">예방점검 완료율</div>
            <div className={`text-3xl font-bold ${kpiData.inspection_completion_rate >= 80 ? 'text-success' : 'text-warning'}`}>
              {kpiData.inspection_completion_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-text-muted mt-1">목표: 80% 이상</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-secondary">
            <div className="text-sm font-medium text-text-muted mb-1">총 작업</div>
            <div className="text-3xl font-bold text-secondary">
              {kpiData.task_summary.total}
            </div>
            <div className="text-xs text-text-muted mt-1">
              완료 {kpiData.task_summary.completed} / 진행 {kpiData.task_summary.in_progress}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {kpiData && (
        <DashboardCharts
          taskChartData={taskChartData}
          slaComplianceRate={kpiData.sla_compliance_rate}
          inspectionCompletionRate={kpiData.inspection_completion_rate}
        />
      )}

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
