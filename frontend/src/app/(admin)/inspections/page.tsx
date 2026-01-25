import Link from "next/link";
import { cookies } from "next/headers";

interface InspectionSchedule {
  id: number;
  equipment_type: string;
  contract: number;
  contract_name: string;
  cycle: string;
  assigned_to: number;
  assigned_to_name: string;
  is_active: boolean;
  task_count: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getInspections(token?: string): Promise<InspectionSchedule[]> {
  try {
    const res = await fetch(`${API_URL}/v1/inspections/schedules/`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const CYCLE_LABELS: Record<string, string> = {
  monthly: "월간",
  quarterly: "분기",
  biannual: "반기",
  annual: "연간",
};

const CYCLE_COLORS: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-800",
  quarterly: "bg-purple-100 text-purple-800",
  biannual: "bg-green-100 text-green-800",
  annual: "bg-orange-100 text-orange-800",
};

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}

function CycleBadge({ cycle }: { cycle: string }) {
  const colorClass = CYCLE_COLORS[cycle] || "bg-gray-100 text-gray-800";
  const label = CYCLE_LABELS[cycle] || cycle;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default async function InspectionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let inspections: InspectionSchedule[] = [];
  let error: string | null = null;

  try {
    inspections = await getInspections(token);
  } catch (e) {
    error = e instanceof Error ? e.message : "점검 스케줄을 불러오지 못했습니다";
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">점검 스케줄 관리</h1>
        <Link
          href="/inspections/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          점검 스케줄 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                장비 유형
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                주기
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                활성 상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                작업 수
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-black">
                  {error ? "점검 스케줄을 불러올 수 없습니다" : "등록된 점검 스케줄이 없습니다"}
                </td>
              </tr>
            ) : (
              inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/inspections/${inspection.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {inspection.equipment_type}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    <Link
                      href={`/contracts/${inspection.contract}`}
                      className="hover:underline"
                    >
                      {inspection.contract_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <CycleBadge cycle={inspection.cycle} />
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {inspection.assigned_to_name}
                  </td>
                  <td className="px-6 py-4">
                    <ActiveBadge isActive={inspection.is_active} />
                  </td>
                  <td className="px-6 py-4 text-black text-sm text-center">
                    {inspection.task_count}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {new Date(inspection.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {inspections.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            {error ? "점검 스케줄을 불러올 수 없습니다" : "등록된 점검 스케줄이 없습니다"}
          </div>
        ) : (
          inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link
                    href={`/inspections/${inspection.id}`}
                    className="font-medium text-blue-600 block"
                  >
                    {inspection.equipment_type}
                  </Link>
                  <div className="text-sm text-black">
                    <Link
                      href={`/contracts/${inspection.contract}`}
                      className="hover:underline"
                    >
                      {inspection.contract_name}
                    </Link>
                  </div>
                </div>
                <ActiveBadge isActive={inspection.is_active} />
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">주기</span>
                  <CycleBadge cycle={inspection.cycle} />
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">담당자</span>
                  <span className="text-black">{inspection.assigned_to_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">작업 수</span>
                  <span className="text-black">{inspection.task_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">등록일</span>
                  <span className="text-black">
                    {new Date(inspection.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
