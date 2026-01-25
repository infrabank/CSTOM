import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

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
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-800",
};

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass = PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-800";
  const label = PRIORITY_LABELS[priority] || priority;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function ComplianceRateBadge({ rate }: { rate: number }) {
  let colorClass = "bg-red-100 text-red-800";
  if (rate > 90) {
    colorClass = "bg-green-100 text-green-800";
  } else if (rate > 70) {
    colorClass = "bg-yellow-100 text-yellow-800";
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
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {isActive ? "활성" : "비활성"}
    </span>
  );
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SLAPage({ searchParams }: PageProps) {
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SLA 정의</h1>
        <Link
          href="/sla/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          SLA 정의 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <Suspense fallback={<TableSkeleton rows={5} columns={7} />}>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  서비스 유형
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  사업
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  응답 목표
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  해결 목표
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  준수율
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  활성 상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slaDefinitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-black">
                    등록된 SLA 정의가 없습니다
                  </td>
                </tr>
              ) : (
                slaDefinitions.map((sla) => (
                  <tr key={sla.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/sla/${sla.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {sla.service_type}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-black text-sm">
                      {sla.contract_name}
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={sla.priority} />
                    </td>
                    <td className="px-6 py-4 text-black text-sm">
                      {formatTime(sla.target_response_time_minutes)}
                    </td>
                    <td className="px-6 py-4 text-black text-sm">
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
            <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
              등록된 SLA 정의가 없습니다
            </div>
          ) : (
            slaDefinitions.map((sla) => (
              <div
                key={sla.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Link
                      href={`/sla/${sla.id}`}
                      className="font-medium text-blue-600 block"
                    >
                      {sla.service_type}
                    </Link>
                    <div className="text-sm text-black">{sla.contract_name}</div>
                  </div>
                  <PriorityBadge priority={sla.priority} />
                </div>

                <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">응답 목표</span>
                    <span className="text-black">
                      {formatTime(sla.target_response_time_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-black">해결 목표</span>
                    <span className="text-black">
                      {formatTime(sla.target_resolution_time_minutes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">준수율</span>
                    <ComplianceRateBadge rate={sla.compliance_rate} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">활성 상태</span>
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
