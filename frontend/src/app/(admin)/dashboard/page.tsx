import Link from "next/link";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
  contract_name: string;
}

async function fetchData<T>(endpoint: string, token?: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [contractsData, equipmentsData, eventsData, tasksData] = await Promise.all([
    fetchData<{ results: ContractListItem[] }>("/contracts/", token),
    fetchData<{ results: EquipmentListItem[] }>("/equipments/", token),
    fetchData<{ results: EventListItem[] }>("/events/", token),
    fetchData<{ results: TaskListItem[] }>("/tasks/", token),
  ]);

  const contracts = contractsData?.results || [];
  const equipments = equipmentsData?.results || [];
  const events = eventsData?.results || [];
  const tasks = tasksData?.results || [];

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      </div>

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
