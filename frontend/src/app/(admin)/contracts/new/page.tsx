"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createContract } from "../actions";

const SCOPES = [
  { value: "ops", label: "운영" },
  { value: "build", label: "구축" },
  { value: "transition", label: "전환" },
  { value: "pm", label: "PM" },
];

export default function NewContractPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createContract(formData);

    if (result.success) {
      router.push(`/contracts/${result.id}`);
    } else {
      setError(result.error || "사업 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link href="/contracts" className="text-accent hover:underline text-sm">
           사업 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사업 등록</h1>

         {error && (
           <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
             {error}
           </div>
         )}

        <form action={handleSubmit} className="space-y-6">
          <div>
             <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
               사업명 *
             </label>
             <input
               id="name"
               type="text"
               name="name"
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div>
             <label htmlFor="client_org" className="block text-sm font-medium text-text mb-1">
               발주처 *
             </label>
             <input
               id="client_org"
               type="text"
               name="client_org"
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label htmlFor="start_date" className="block text-sm font-medium text-text mb-1">
                 시작일 *
               </label>
               <input
                 id="start_date"
                 type="date"
                 name="start_date"
                 required
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
            </div>
            <div>
               <label htmlFor="end_date" className="block text-sm font-medium text-text mb-1">
                 종료일 *
               </label>
               <input
                 id="end_date"
                 type="date"
                 name="end_date"
                 required
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
            </div>
          </div>

          <div>
             <label htmlFor="contract_amount" className="block text-sm font-medium text-text mb-1">
               계약 금액
             </label>
             <input
               id="contract_amount"
               type="text"
               name="contract_amount"
               placeholder="예: 100,000,000"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          <div>
             <span className="block text-sm font-medium text-text mb-2">
               사업 범위
             </span>
            <div className="flex flex-wrap gap-4">
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     name="scopes"
                     value={scope.value}
                     className="rounded border-border text-accent focus:ring-accent"
                   />
                  <span className="text-sm">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
             <span className="block text-sm font-medium text-text mb-2">
               리스크 플래그
             </span>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_pre_env"
                   className="rounded border-border text-danger focus:ring-danger"
                 />
                <span className="text-sm">인수 전 환경</span>
              </label>
              <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_prior_vendor"
                   className="rounded border-border text-danger focus:ring-danger"
                 />
                <span className="text-sm">전 사업자 협업 필요</span>
              </label>
              <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_docs_incomplete"
                   className="rounded border-border text-danger focus:ring-danger"
                 />
                <span className="text-sm">문서 불완전</span>
              </label>
            </div>
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
               href="/contracts"
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
