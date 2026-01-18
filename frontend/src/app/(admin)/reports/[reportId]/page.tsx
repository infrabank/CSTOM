/**
 * Report detail page.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

interface Report {
  id: number;
  contract: number;
  contract_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: string;
  integrity_hash: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getReport(id: number): Promise<Report | null> {
  try {
    const res = await fetch(`${API_URL}/reports/${id}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly Report",
  incident: "Incident Report",
  audit: "Audit Report",
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

  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/reports" className="text-blue-600 hover:underline text-sm">
          Back to reports
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {TYPE_LABELS[report.report_type]}
            </h1>
            <p className="text-gray-600">{report.contract_name}</p>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Period</h3>
            <p>
              {report.period_start} - {report.period_end}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Generated</h3>
            <p>{new Date(report.generated_at).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Integrity</h3>
            <p className="font-mono text-xs text-gray-500 truncate" title={report.integrity_hash}>
              {report.integrity_hash.substring(0, 16)}...
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Report Content</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {report.summary || "No content generated"}
          </pre>
        </div>
      </div>
    </div>
  );
}
