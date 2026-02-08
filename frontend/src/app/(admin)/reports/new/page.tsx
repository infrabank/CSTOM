"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";
import { generateReport } from "../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
}

const REPORT_TYPES = [
  { value: "monthly", label: "월간 보고서" },
  { value: "incident", label: "장애 보고서" },
  { value: "audit", label: "감사 보고서" },
];

export default function NewReportPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const token = getAccessToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${API_URL}/v1/contracts/`, { headers });
        if (res.ok) {
          const data = await res.json();
          setContracts(data.results || []);
        }
      } catch {
      }
    }
    fetchContracts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await generateReport(formData);

    if (result.success) {
      router.push(`/reports/${result.id}`);
    } else {
      setError(result.error || "보고서 생성에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link href="/reports" className="text-accent hover:underline text-sm">
           보고서 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">보고서 생성</h1>

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
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : "생성"}
            </button>
             <Link
               href="/reports"
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
