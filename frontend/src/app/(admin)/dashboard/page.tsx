'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAccessToken } from "@/lib/auth";

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

// Removed unused fetchData function

const STATUS_LABELS: Record<string, string> = {
  "pre-handover": "인수 전",
  handover: "인수",
  stabilization: "안정화",
  steady: "정상 운영",
  closed: "종료",
};

const STATUS_COLORS: Record<string, string> = {
  "pre-handover": "bg-yellow-100 text-yellow-800",
  handover: "bg-blue-100 text-blue-800",
  stabilization: "bg-purple-100 text-purple-800",
  steady: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-black",
};

const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  checked_out: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-orange-100 text-orange-800",
  retired: "bg-gray-100 text-black",
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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

  // Calculate stats
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
      <div className="p-6">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'quarter'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'today' ? '오늘' : p === 'week' ? '주간' : p === 'month' ? '월간' : '분기'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">SLA 준수율</div>
            <div className={`text-3xl font-bold ${kpiData.sla_compliance_rate >= 90 ? 'text-green-600' : kpiData.sla_compliance_rate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {kpiData.sla_compliance_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">목표: 90% 이상</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">평균 복구 시간 (MTTR)</div>
            <div className="text-3xl font-bold text-blue-600">
              {kpiData.mttr_hours.toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500 mt-1">시간 단위</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">예방점검 완료율</div>
            <div className={`text-3xl font-bold ${kpiData.inspection_completion_rate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              {kpiData.inspection_completion_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">목표: 80% 이상</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">총 작업</div>
            <div className="text-3xl font-bold text-purple-600">
              {kpiData.task_summary.total}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              완료 {kpiData.task_summary.completed} / 진행 {kpiData.task_summary.in_progress}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {kpiData && (
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">작업 현황</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">KPI 요약</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'SLA 준수율', value: kpiData.sla_compliance_rate },
                  { name: '점검 완료율', value: kpiData.inspection_completion_rate },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="비율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-black mb-1">활성 사업</div>
          <div className="text-3xl font-bold text-blue-600">{activeContracts}</div>
          <div className="text-xs text-black mt-1">총 {contracts.length}개 사업</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-black mb-1">리스크 사업</div>
          <div className="text-3xl font-bold text-red-600">{contractsWithRisks}</div>
          <div className="text-xs text-black mt-1">주의 필요</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-black mb-1">반출 장비</div>
          <div className="text-3xl font-bold text-yellow-600">{checkedOutEquipments}</div>
          <div className="text-xs text-black mt-1">
            가용 {availableEquipments}개 / 총 {equipments.length}개
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-black mb-1">고영향 작업</div>
          <div className="text-3xl font-bold text-orange-600">{highImpactTasks}</div>
          <div className="text-xs text-black mt-1">총 {tasks.length}개 작업</div>
        </div>

        <Link href="/tasks?filter=pending" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-black mb-1">승인 대기</div>
          <div className={`text-3xl font-bold ${pendingApprovals.length > 0 ? "text-orange-600" : "text-gray-400"}`}>
            {pendingApprovals.length}
          </div>
          <div className="text-xs text-black mt-1">클릭하여 확인</div>
        </Link>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-orange-800">승인 대기 작업</h2>
            <Link href="/tasks?filter=pending" className="text-orange-600 text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between bg-white rounded-md p-3"
              >
                <div>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {task.title}
                  </Link>
                  <div className="text-xs text-gray-500">{task.contract_name}</div>
                </div>
                <Link
                  href={`/tasks/${task.id}`}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
                >
                  승인하기
                </Link>
              </div>
            ))}
          </div>
          {pendingApprovals.length > 3 && (
            <div className="text-center mt-3">
              <span className="text-sm text-orange-600">
                외 {pendingApprovals.length - 3}건 더 있음
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Contract Status Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">사업 현황</h2>
            <Link href="/contracts" className="text-blue-600 text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <p className="text-black text-center py-4">등록된 사업이 없습니다</p>
            ) : (
              contracts.slice(0, 5).map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {contract.name}
                    </Link>
                    <div className="text-xs text-black">{contract.client_org}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[contract.status] || "bg-gray-100"
                    }`}
                  >
                    {STATUS_LABELS[contract.status] || contract.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">최근 장애</h2>
            <Link href="/events" className="text-blue-600 text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {recentIncidents.length === 0 ? (
              <p className="text-black text-center py-4">최근 장애가 없습니다</p>
            ) : (
              recentIncidents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {event.title}
                    </Link>
                    <div className="text-xs text-black">{event.contract_name}</div>
                  </div>
                  <span className="text-xs text-black">
                    {new Date(event.occurred_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">장비 현황</h2>
            <Link href="/equipments" className="text-blue-600 text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {equipments.length === 0 ? (
              <p className="text-black text-center py-4">등록된 장비가 없습니다</p>
            ) : (
              equipments.slice(0, 5).map((equipment) => (
                <div
                  key={equipment.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <Link
                      href={`/equipments/${equipment.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {equipment.name}
                    </Link>
                    <div className="text-xs text-black">{equipment.contract_name}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      EQUIPMENT_STATUS_COLORS[equipment.status] || "bg-gray-100"
                    }`}
                  >
                    {equipment.status === "available"
                      ? "가용"
                      : equipment.status === "checked_out"
                      ? "반출"
                      : equipment.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">최근 작업</h2>
            <Link href="/tasks" className="text-blue-600 text-sm hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-black text-center py-4">등록된 작업이 없습니다</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {task.title}
                    </Link>
                    <div className="text-xs text-black">{task.contract_name}</div>
                  </div>
                  {task.impact_level === "full" && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
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
