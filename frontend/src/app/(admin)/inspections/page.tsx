import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";

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
      next: { revalidate: 30 },
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
  monthly: "bg-info-bg text-accent",
  quarterly: "bg-accent-light text-accent",
  biannual: "bg-success-bg text-success",
  annual: "bg-warning-bg text-warning",
};

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive
          ? "bg-success-bg text-success"
          : "bg-surface-sunken text-text-muted"
      }`}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}

function CycleBadge({ cycle }: { cycle: string }) {
  const colorClass = CYCLE_COLORS[cycle] || "bg-surface-sunken text-text-muted";
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
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">점검 스케줄 관리</h1>
        <Link
          href="/inspections/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          점검 스케줄 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                장비 유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                주기
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                활성 상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                작업 수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                  {error ? "점검 스케줄을 불러올 수 없습니다" : "등록된 점검 스케줄이 없습니다"}
                </td>
              </tr>
            ) : (
              inspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/inspections/${inspection.id}`}
                      className="text-accent hover:underline font-medium text-sm"
                    >
                      {inspection.equipment_type}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
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
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {inspection.assigned_to_name}
                  </td>
                  <td className="px-6 py-4">
                    <ActiveBadge isActive={inspection.is_active} />
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm text-center">
                    {inspection.task_count}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
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
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            {error ? "점검 스케줄을 불러올 수 없습니다" : "등록된 점검 스케줄이 없습니다"}
          </div>
        ) : (
          inspections.map((inspection) => (
            <div
              key={inspection.id}
              className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link
                    href={`/inspections/${inspection.id}`}
                    className="font-medium text-accent block text-sm"
                  >
                    {inspection.equipment_type}
                  </Link>
                  <div className="text-sm text-text-muted">
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

              <div className="space-y-2 text-sm border-t border-border-light pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">주기</span>
                  <CycleBadge cycle={inspection.cycle} />
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">담당자</span>
                  <span className="text-text-muted">{inspection.assigned_to_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">작업 수</span>
                  <span className="text-text-muted">{inspection.task_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">등록일</span>
                  <span className="text-text-muted">
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
