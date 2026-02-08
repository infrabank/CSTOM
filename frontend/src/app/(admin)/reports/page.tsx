import Link from "next/link";
import { cookies } from "next/headers";
import { reportsApi, ReportListItem } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  monthly: "월간 보고서",
  incident: "장애 보고서",
  audit: "감사 보고서",
};

const TYPE_COLORS: Record<string, string> = {
  monthly: "bg-info-bg text-info",
  incident: "bg-danger-bg text-danger",
  audit: "bg-info-bg text-info",
};

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

       <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden">
         <table className="min-w-full divide-y divide-border-light">
           <thead className="bg-surface-sunken">
             <tr>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 유형
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 사업
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 기간
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 생성일
               </th>
             </tr>
           </thead>
           <tbody className="bg-surface divide-y divide-border-light">
            {reports.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-4 text-center text-text">
                   생성된 보고서가 없습니다
                 </td>
               </tr>
            ) : (
               reports.map((report) => (
                 <tr key={report.id} className="hover:bg-surface-sunken">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        TYPE_COLORS[report.report_type]
                      }`}
                    >
                      {TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/reports/${report.id}`}
                       className="text-accent hover:underline"
                    >
                      {report.contract_name}
                    </Link>
                  </td>
                   <td className="px-6 py-4 text-text text-sm">
                     {report.period_start} ~ {report.period_end}
                   </td>
                   <td className="px-6 py-4 text-text text-sm">
                     {new Date(report.generated_at).toLocaleString("ko-KR")}
                   </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
         {reports.length === 0 ? (
           <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text">
             생성된 보고서가 없습니다
           </div>
        ) : (
           reports.map((report) => (
             <div key={report.id} className="bg-surface rounded-lg shadow-card p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      TYPE_COLORS[report.report_type]
                    }`}
                  >
                    {TYPE_LABELS[report.report_type] || report.report_type}
                  </span>
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
          ))
        )}
      </div>
    </div>
  );
}
