import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/ui/breadcrumb";

interface Penalty {
  id: number;
  report: number;
  penalty_type: string;
  penalty_type_display: string;
  evaluation_item: number | null;
  item_name: string | null;
  penalty_rate: string;
  penalty_amount: string | null;
  is_offset: boolean;
  notes: string;
  created_at: string;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount: string | null): string {
  if (!amount) return "-";
  return Number(amount).toLocaleString() + "원";
}

export default async function SLAPenaltiesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let penalties: Penalty[] = [];
  let error: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${apiUrl}/v1/sla/penalties/?page_size=100`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error("벌점 데이터를 불러오지 못했습니다");
    const data = await response.json();
    penalties = data.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "벌점 데이터를 불러오지 못했습니다";
  }

  const totalPenalty = penalties
    .filter((p) => !p.is_offset)
    .reduce((sum, p) => sum + Number(p.penalty_amount || 0), 0);
  const offsetAmount = penalties
    .filter((p) => p.is_offset)
    .reduce((sum, p) => sum + Number(p.penalty_amount || 0), 0);
  const netPenalty = totalPenalty - offsetAmount;

  return (
    <div>
      <Breadcrumb />
      <h1 className="text-2xl font-semibold text-text mb-6">벌점 관리</h1>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">총 벌점금액</div>
          <div className="text-xl font-semibold text-danger mt-1">{totalPenalty.toLocaleString()}원</div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">상계금액</div>
          <div className="text-xl font-semibold text-success mt-1">{offsetAmount.toLocaleString()}원</div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">순 벌점금액</div>
          <div className="text-xl font-semibold text-text mt-1">{netPenalty.toLocaleString()}원</div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
        {/* Desktop */}
        <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">관련항목</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">벌점율</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase">벌점금액</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-text-muted uppercase">상계</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">비고</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {penalties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">
                    등록된 벌점이 없습니다
                  </td>
                </tr>
              ) : (
                penalties.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-sunken">
                    <td className="px-6 py-4 text-sm text-text">{p.penalty_type_display}</td>
                    <td className="px-6 py-4 text-sm text-text">{p.item_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-text text-right">{p.penalty_rate}%</td>
                    <td className="px-6 py-4 text-sm text-text text-right">{formatAmount(p.penalty_amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.is_offset ? "bg-success-bg text-success" : "bg-surface-sunken text-text-muted"
                      }`}>
                        {p.is_offset ? "상계" : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{p.notes || "-"}</td>
                    <td className="px-6 py-4 text-sm text-text-muted">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-4">
          {penalties.length === 0 ? (
            <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text-muted">
              등록된 벌점이 없습니다
            </div>
          ) : (
            penalties.map((p) => (
              <div key={p.id} className="bg-surface rounded-lg shadow-card p-4 space-y-2 border border-border-light">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-text text-sm">{p.penalty_type_display}</span>
                  {p.is_offset && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-bg text-success">상계</span>
                  )}
                </div>
                {p.item_name && <div className="text-sm text-text-secondary">{p.item_name}</div>}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">벌점율</span>
                  <span className="text-text">{p.penalty_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">벌점금액</span>
                  <span className="text-danger font-medium">{formatAmount(p.penalty_amount)}</span>
                </div>
                {p.notes && <div className="text-xs text-text-secondary">{p.notes}</div>}
              </div>
            ))
          )}
        </div>
      </Suspense>
    </div>
  );
}
