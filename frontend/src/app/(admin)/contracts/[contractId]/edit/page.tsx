"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { contractsApi, Contract } from "@/lib/api";
import { updateContract } from "../../actions";

const SCOPES = [
  { value: "ops", label: "운영" },
  { value: "build", label: "구축" },
  { value: "transition", label: "전환" },
  { value: "pm", label: "PM" },
];

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export default function EditContractPage({ params }: PageProps) {
  const { contractId } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      try {
        const data = await contractsApi.get(parseInt(contractId, 10));
        setContract(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사업 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContract();
  }, [contractId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateContract(parseInt(contractId, 10), formData);

    if (result.success) {
      router.push(`/contracts/${contractId}`);
    } else {
      setError(result.error || "사업 수정에 실패했습니다");
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

  if (!contract) {
    return (
      <div className="p-6">
         <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
           {error || "사업을 찾을 수 없습니다"}
         </div>
         <Link href="/contracts" className="text-accent hover:underline">
          사업 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link
           href={`/contracts/${contractId}`}
           className="text-accent hover:underline text-sm"
         >
          사업 상세로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사업 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-text mb-1">
               사업명 *
             </label>
             <input
               type="text"
               name="name"
               defaultValue={contract.name}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               발주처 *
             </label>
             <input
               type="text"
               name="client_org"
               defaultValue={contract.client_org}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 시작일 *
               </label>
               <input
                 type="date"
                 name="start_date"
                 defaultValue={contract.start_date}
                 required
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 종료일 *
               </label>
               <input
                 type="date"
                 name="end_date"
                 defaultValue={contract.end_date}
                 required
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               계약 금액
             </label>
             <input
               type="text"
               name="contract_amount"
               defaultValue={contract.contract_amount || ""}
               placeholder="예: 100,000,000"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-2">
               사업 범위
             </label>
             <div className="flex flex-wrap gap-4">
               {SCOPES.map((scope) => (
                 <label key={scope.value} className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     name="scopes"
                     value={scope.value}
                     defaultChecked={contract.scopes.includes(scope.value)}
                     className="rounded border-border text-accent focus:ring-accent"
                   />
                   <span className="text-sm">{scope.label}</span>
                 </label>
               ))}
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-2">
               리스크 플래그
             </label>
             <div className="space-y-2">
               <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_pre_env"
                   defaultChecked={contract.risk_flags.pre_env}
                   className="rounded border-border text-danger focus:ring-danger"
                 />
                 <span className="text-sm">인수 전 환경</span>
               </label>
               <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_prior_vendor"
                   defaultChecked={contract.risk_flags.prior_vendor_coordination}
                   className="rounded border-border text-danger focus:ring-danger"
                 />
                 <span className="text-sm">전 사업자 협업 필요</span>
               </label>
               <label className="flex items-center gap-2">
                 <input
                   type="checkbox"
                   name="risk_docs_incomplete"
                   defaultChecked={contract.risk_flags.docs_incomplete}
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
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
             <Link
               href={`/contracts/${contractId}`}
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
