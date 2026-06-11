"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { contractsApi, ContractListItem } from "@/lib/api";
import { createEvent } from "../actions";

const RECORD_TYPES = [
  { value: "change", label: "변경" },
  { value: "incident", label: "장애" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "1", label: "심각도 1 (서비스 전면중단)" },
  { value: "2", label: "심각도 2 (주요기능 장애)" },
  { value: "3", label: "심각도 3 (경미한 장애)" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [recordType, setRecordType] = useState("change");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const data = await contractsApi.list();
        setContracts(data.results || []);
      } catch {
      }
    }
    fetchContracts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createEvent(formData);

    if (result.success) {
      router.push(`/events/${result.id}`);
    } else {
      setError(result.error || "이벤트 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link href="/events" className="text-accent hover:underline text-sm">
           이벤트 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">이벤트 등록</h1>

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
             <label htmlFor="record_type" className="block text-sm font-medium text-text mb-1">
               유형 *
             </label>
             <select
               id="record_type"
               name="record_type"
               required
               value={recordType}
               onChange={(e) => setRecordType(e.target.value)}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              {RECORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {recordType === "incident" && (
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-text mb-1">
                심각도
              </label>
              <select
                id="severity"
                name="severity"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-secondary">
                SLA 평가 시 심각도별 가중치 적용: 심각도1=1.0건, 심각도2=0.5건, 심각도3=제외
              </p>
            </div>
          )}

          <div>
             <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
               제목 *
             </label>
             <input
               id="title"
               type="text"
               name="title"
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div>
             <label htmlFor="description" className="block text-sm font-medium text-text mb-1">
               상세 내용
             </label>
             <textarea
               id="description"
               name="description"
               rows={4}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="occurred_at" className="block text-sm font-medium text-text mb-1">
                 발생 시각 *
               </label>
               <input
                 id="occurred_at"
                 type="datetime-local"
                 name="occurred_at"
                 required
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
            </div>
            <div>
               <label htmlFor="detected_at" className="block text-sm font-medium text-text mb-1">
                 인지 시각
               </label>
               <input
                 id="detected_at"
                 type="datetime-local"
                 name="detected_at"
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
            </div>
          </div>

          <div>
             <label htmlFor="resolved_at" className="block text-sm font-medium text-text mb-1">
               해결 시각
             </label>
             <input
               id="resolved_at"
               type="datetime-local"
               name="resolved_at"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
               <input
                 id="customer_notified"
                 type="checkbox"
                 name="customer_notified"
                 className="rounded border-border text-accent focus:ring-accent"
               />
              <span className="text-sm">고객 통보 완료</span>
            </label>
          </div>

          <div>
             <label htmlFor="customer_notified_at" className="block text-sm font-medium text-text mb-1">
               고객 통보 시각
             </label>
             <input
               id="customer_notified_at"
               type="datetime-local"
               name="customer_notified_at"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
             <Link
               href="/events"
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
