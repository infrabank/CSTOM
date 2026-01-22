import Link from "next/link";

interface Report {
  id: number;
  contract: number;
  contract_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getReports(): Promise<Report[]> {
  try {
    const res = await fetch(`${API_URL}/reports/`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const TYPE_LABELS: Record<string, string> = {
  monthly: "월간 보고서",
  incident: "장애 보고서",
  audit: "감사 보고서",
};

const TYPE_COLORS: Record<string, string> = {
  monthly: "bg-blue-100 text-blue-700",
  incident: "bg-red-100 text-red-700",
  audit: "bg-purple-100 text-purple-700",
};

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">보고서</h1>
        <Link
          href="/reports/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          보고서 생성
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                생성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  생성된 보고서가 없습니다
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
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
                      className="text-blue-600 hover:underline"
                    >
                      {report.contract_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {report.period_start} ~ {report.period_end}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(report.generated_at).toLocaleString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
