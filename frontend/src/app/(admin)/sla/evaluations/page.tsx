import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/ui/breadcrumb";

interface SLAEvaluationReport {
  id: number;
  contract: number;
  contract_name: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  total_score: number | null;
  grade: string;
  grade_display: string;
  is_finalized: boolean;
  created_at: string;
}

interface SLAEvaluationListResponse {
  results: SLAEvaluationReport[];
}

const GRADE_COLORS: Record<string, string> = {
  S: "bg-success-bg text-success",
  A: "bg-info-bg text-accent",
  B: "bg-warning-bg text-warning",
  C: "bg-danger-bg text-danger",
  D: "bg-danger-bg text-danger",
};

function GradeBadge({ grade }: { grade: string }) {
  const colorClass = GRADE_COLORS[grade] || "bg-surface-sunken text-text-muted";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {grade}
    </span>
  );
}

function FinalizedBadge({ isFinalized }: { isFinalized: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isFinalized
          ? "bg-success-bg text-success"
          : "bg-surface-sunken text-text-muted"
      }`}
    >
      {isFinalized ? "확정" : "미확정"}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) {
    return "-";
  }
  return score.toFixed(1);
}

export default async function SLAEvaluationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let evaluationReports: SLAEvaluationReport[] = [];
  let error: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${apiUrl}/v1/sla/evaluation-reports/`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error("SLA 평가 보고서 목록을 불러오지 못했습니다");
    }

    const data: SLAEvaluationListResponse = await response.json();
    evaluationReports = data.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "SLA 평가 보고서 목록을 불러오지 못했습니다";
  }

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">SLA 평가 보고서</h1>
        <Link
          href="/sla/evaluations/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          신규 평가 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      <Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
          <table className="min-w-full divide-y divide-border-light">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  평가기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  사업명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  총점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  확정여부
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                  등록일
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-light">
              {evaluationReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                    등록된 SLA 평가 보고서가 없습니다
                  </td>
                </tr>
              ) : (
                evaluationReports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-sunken">
                    <td className="px-6 py-4">
                      <Link
                        href={`/sla/evaluations/${report.id}`}
                        className="text-accent hover:underline font-medium"
                      >
                        {formatPeriod(report.evaluation_period_start, report.evaluation_period_end)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-text text-sm">
                      {report.contract_name}
                    </td>
                    <td className="px-6 py-4 text-text text-sm">
                      {formatScore(report.total_score)}
                    </td>
                    <td className="px-6 py-4">
                      <GradeBadge grade={report.grade} />
                    </td>
                    <td className="px-6 py-4">
                      <FinalizedBadge isFinalized={report.is_finalized} />
                    </td>
                    <td className="px-6 py-4 text-text text-sm">
                      {formatDate(report.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {evaluationReports.length === 0 ? (
            <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text">
              등록된 SLA 평가 보고서가 없습니다
            </div>
          ) : (
            evaluationReports.map((report) => (
              <div
                key={report.id}
                className="bg-surface rounded-lg shadow-card p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Link
                      href={`/sla/evaluations/${report.id}`}
                      className="font-medium text-accent block"
                    >
                      {formatPeriod(report.evaluation_period_start, report.evaluation_period_end)}
                    </Link>
                    <div className="text-sm text-text">{report.contract_name}</div>
                  </div>
                  <GradeBadge grade={report.grade} />
                </div>

                <div className="space-y-2 text-sm border-t border-border-light pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-text">총점</span>
                    <span className="text-text">{formatScore(report.total_score)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-text">확정여부</span>
                    <FinalizedBadge isFinalized={report.is_finalized} />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-text">등록일</span>
                    <span className="text-text">{formatDate(report.created_at)}</span>
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
