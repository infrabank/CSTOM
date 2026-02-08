import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/ui/breadcrumb";

interface SLADefinition {
  id: number;
  contract: number;
  contract_name: string;
  service_type: string;
  priority: string;
  target_response_time_minutes: number;
  target_resolution_time_minutes: number;
  is_active: boolean;
  metric_count: number;
  compliance_rate: number;
  created_at: string;
}

interface SLAListResponse {
  results: SLADefinition[];
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger",
  high: "bg-warning-bg text-warning",
  medium: "bg-info-bg text-accent",
  low: "bg-surface-sunken text-text-muted",
};

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass = PRIORITY_COLORS[priority] || "bg-surface-sunken text-text-muted";
  const label = PRIORITY_LABELS[priority] || priority;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function ComplianceRateBadge({ rate }: { rate: number }) {
  let colorClass = "bg-danger-bg text-danger";
  if (rate > 90) {
    colorClass = "bg-success-bg text-success";
  } else if (rate > 70) {
    colorClass = "bg-warning-bg text-warning";
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}시간`;
}

function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
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

export default async function SLAPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let slaDefinitions: SLADefinition[] = [];
  let error: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${apiUrl}/v1/sla/definitions/`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("SLA 정의 목록을 불러오지 못했습니다");
    }

    const data: SLAListResponse = await response.json();
    slaDefinitions = data.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "SLA 정의 목록을 불러오지 못했습니다";
  }

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">SLA 정의</h1>
        <Link
          href="/sla/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          SLA 정의 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      <Suspense fallback={<TableSkeleton rows={5} columns={7} />}>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  서비스 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  사업
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  응답 목표
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  해결 목표
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  준수율
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  활성 상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-light">
              {slaDefinitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    등록된 SLA 정의가 없습니다
                  </td>
                </tr>
              ) : (
                slaDefinitions.map((sla) => (
                   <tr key={sla.id} className="hover:bg-surface-sunken">
                    <td className="px-6 py-4">
                      <Link
                        href={`/sla/${sla.id}`}
                        className="text-accent hover:underline font-medium"
                      >
                        {sla.service_type}
                      </Link>
                    </td>
                     <td className="px-6 py-4 text-text text-sm">
                       {sla.contract_name}
                     </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={sla.priority} />
                    </td>
                     <td className="px-6 py-4 text-text text-sm">
                       {formatTime(sla.target_response_time_minutes)}
                     </td>
                     <td className="px-6 py-4 text-text text-sm">
                       {formatTime(sla.target_resolution_time_minutes)}
                     </td>
                    <td className="px-6 py-4">
                      <ComplianceRateBadge rate={sla.compliance_rate} />
                    </td>
                    <td className="px-6 py-4">
                      <ActiveStatusBadge isActive={sla.is_active} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {slaDefinitions.length === 0 ? (
            <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text">
               등록된 SLA 정의가 없습니다
             </div>
          ) : (
            slaDefinitions.map((sla) => (
              <div
                key={sla.id}
                className="bg-surface rounded-lg shadow-card p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Link
                      href={`/sla/${sla.id}`}
                      className="font-medium text-accent block"
                    >
                      {sla.service_type}
                    </Link>
                    <div className="text-sm text-text">{sla.contract_name}</div>
                  </div>
                  <PriorityBadge priority={sla.priority} />
                </div>

                <div className="space-y-2 text-sm border-t border-border-light pt-3">
                  <div className="flex justify-between">
                     <span className="font-medium text-text">응답 목표</span>
                     <span className="text-text">
                       {formatTime(sla.target_response_time_minutes)}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="font-medium text-text">해결 목표</span>
                     <span className="text-text">
                       {formatTime(sla.target_resolution_time_minutes)}
                     </span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="font-medium text-text">준수율</span>
                     <ComplianceRateBadge rate={sla.compliance_rate} />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="font-medium text-text">활성 상태</span>
                     <ActiveStatusBadge isActive={sla.is_active} />
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Suspense>
    </div>
  );
}
