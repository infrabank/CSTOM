"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateReport } from "../../actions";
import {
  reportsApi,
  contractsApi,
  type ContractListItem as Contract,
} from "@/lib/api";
import { REPORT_TYPE_LABELS, optionsFromLabels } from "@/lib/labels";

interface Report {
  id: number;
  contract: number;
  contract_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: string;
}

const REPORT_TYPES = optionsFromLabels(REPORT_TYPE_LABELS);

interface PageProps {
  params: Promise<{ reportId: string }>;
}

export default function EditReportPage({ params }: PageProps) {
  const { reportId } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportData, contractsData] = await Promise.all([
          reportsApi.get(parseInt(reportId, 10)),
          contractsApi.list(),
        ]);
        setReport(reportData);
        setContracts(contractsData.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "보고서 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [reportId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateReport(parseInt(reportId, 10), formData);

    if (result.success) {
      router.push(`/reports/${reportId}`);
    } else {
      setError(result.error || "보고서 수정에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text">불러오는 중...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error || "보고서를 찾을 수 없습니다"}
        </div>
         <Link href="/reports" className="text-accent hover:underline">
          보고서 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link
           href={`/reports/${reportId}`}
           className="text-accent hover:underline text-sm"
         >
          보고서 상세로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">보고서 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
           <div>
             <label htmlFor="contract" className="block text-sm font-medium text-text mb-1">
               사업 *
             </label>
             <select
               id="contract"
               name="contract"
               required
               defaultValue={report.contract}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              <option value="">사업 선택</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>

           <div>
             <label htmlFor="report_type" className="block text-sm font-medium text-text mb-1">
               보고서 유형 *
             </label>
             <select
               id="report_type"
               name="report_type"
               required
               defaultValue={report.report_type}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label htmlFor="period_start" className="block text-sm font-medium text-text mb-1">
                 시작일 *
               </label>
               <input
                 id="period_start"
                 type="date"
                 name="period_start"
                 required
                 defaultValue={report.period_start}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
             <div>
               <label htmlFor="period_end" className="block text-sm font-medium text-text mb-1">
                 종료일 *
               </label>
               <input
                 id="period_end"
                 type="date"
                 name="period_end"
                 required
                 defaultValue={report.period_end}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
           </div>

           <div className="text-sm text-text">
             생성일: {new Date(report.generated_at).toLocaleString("ko-KR")}
           </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
             <Link
               href={`/reports/${reportId}`}
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
