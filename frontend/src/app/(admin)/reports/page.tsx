import Link from "next/link";
import { cookies } from "next/headers";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import { reportsApi, ReportListItem } from "@/lib/api";
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPE_COLORS,
  labelOf,
  colorOf,
} from "@/lib/labels";

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let reports: ReportListItem[] = [];
  let error: string | null = null;

  try {
    const response = await reportsApi.list(token);
    reports = response.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "보고서 목록을 불러오지 못했습니다";
  }

  const columns: Column<ReportListItem>[] = [
    {
      key: "report_type",
      header: "유형",
      render: (report) => (
        <StatusBadge
          label={labelOf(REPORT_TYPE_LABELS, report.report_type)}
          colorClass={colorOf(REPORT_TYPE_COLORS, report.report_type)}
        />
      ),
    },
    {
      key: "contract_name",
      header: "사업",
      render: (report) => (
        <Link
          href={`/reports/${report.id}`}
          className="text-accent hover:underline"
        >
          {report.contract_name}
        </Link>
      ),
    },
    {
      key: "period",
      header: "기간",
      className: "text-text text-sm",
      render: (report) => `${report.period_start} ~ ${report.period_end}`,
    },
    {
      key: "generated_at",
      header: "생성일",
      className: "text-text text-sm",
      render: (report) =>
        new Date(report.generated_at).toLocaleString("ko-KR"),
    },
  ];

  const renderMobileCard = (report: ReportListItem) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <StatusBadge
            label={labelOf(REPORT_TYPE_LABELS, report.report_type)}
            colorClass={colorOf(REPORT_TYPE_COLORS, report.report_type)}
          />
          <div className="mt-1">
            <Link
              href={`/reports/${report.id}`}
              className="font-medium text-accent block"
            >
              {report.contract_name}
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text">기간</span>
          <span className="text-text">
            {report.period_start} ~ {report.period_end}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">생성일</span>
          <span className="text-text">
            {new Date(report.generated_at).toLocaleString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">보고서</h1>
        <Link
          href="/reports/new"
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          보고서 생성
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error}
        </div>
      )}

      <ResponsiveTable
        columns={columns}
        rows={reports}
        rowKey={(report) => report.id}
        emptyMessage="생성된 보고서가 없습니다"
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}
