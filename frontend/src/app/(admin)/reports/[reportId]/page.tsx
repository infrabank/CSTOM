import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { reportsApi, Report } from "@/lib/api";
import PdfDownloadButton from "../pdf-download-button";

const TYPE_LABELS: Record<string, string> = {
  monthly: "월간 보고서",
  incident: "장애 보고서",
  audit: "감사 보고서",
};

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const id = parseInt(reportId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let report: Report | null = null;
  try {
    report = await reportsApi.get(id, token);
  } catch {
    notFound();
  }

  if (!report) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/reports" className="text-blue-600 hover:underline text-sm">
          보고서 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {TYPE_LABELS[report.report_type] || report.report_type}
            </h1>
            <p className="text-black">{report.contract_name}</p>
          </div>
          <PdfDownloadButton
            reportTitle={`${TYPE_LABELS[report.report_type] || report.report_type} - ${report.contract_name}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-black">기간</h3>
            <p>
              {report.period_start} ~ {report.period_end}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">생성일</h3>
            <p>{new Date(report.generated_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">무결성 해시</h3>
            <p className="font-mono text-xs text-black truncate" title={report.integrity_hash}>
              {report.integrity_hash.substring(0, 16)}...
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">보고서 내용</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {report.summary || "내용이 생성되지 않았습니다"}
          </pre>
        </div>
      </div>
    </div>
  );
}
