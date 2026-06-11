"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { contractsApi } from "@/lib/api";
import { slaDefinitionsApi } from "../api-local";

interface Contract {
  id: number;
  name: string;
}

export default function NewSLADefinitionPage() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [targetResponseTimeMinutes, setTargetResponseTimeMinutes] = useState("");
  const [targetResolutionTimeMinutes, setTargetResolutionTimeMinutes] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [contractId, setContractId] = useState("");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch contracts on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractsData = await contractsApi.list();
        setContracts(contractsData.results || []);
      } catch (err) {
        console.error("Failed to fetch contracts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await slaDefinitionsApi.create({
        contract: parseInt(contractId),
        service_type: serviceType,
        priority,
        target_response_time_minutes: parseInt(targetResponseTimeMinutes),
        target_resolution_time_minutes: parseInt(targetResolutionTimeMinutes),
        description,
        is_active: isActive,
      });
      router.push(`/sla/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SLA 정의 생성에 실패했습니다");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">새 SLA 정의 등록</h1>
      </div>

       {error && (
         <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
           <p className="text-danger">{error}</p>
         </div>
       )}

       <form onSubmit={handleSubmit} className="bg-surface shadow-card rounded-lg p-6 space-y-6">
        <div>
           <label htmlFor="contract" className="block text-sm font-medium text-text-secondary mb-2">
             관련 사업 <span className="text-danger">*</span>
           </label>
           <select
             id="contract"
             value={contractId}
             onChange={(e) => setContractId(e.target.value)}
             required
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
           >
            <option value="">사업을 선택하세요</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </select>
        </div>

        <div>
           <label htmlFor="serviceType" className="block text-sm font-medium text-text-secondary mb-2">
             서비스 유형 <span className="text-danger">*</span>
           </label>
           <input
             type="text"
             id="serviceType"
             value={serviceType}
             onChange={(e) => setServiceType(e.target.value)}
             required
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             placeholder="예: 장애 대응, 변경 관리, 정기 점검"
           />
        </div>

        <div>
           <label htmlFor="priority" className="block text-sm font-medium text-text-secondary mb-2">
             우선순위 <span className="text-danger">*</span>
           </label>
           <select
             id="priority"
             value={priority}
             onChange={(e) => setPriority(e.target.value)}
             required
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
           >
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="critical">긴급</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label htmlFor="targetResponseTime" className="block text-sm font-medium text-text-secondary mb-2">
               목표 응답 시간 (분) <span className="text-danger">*</span>
             </label>
             <input
               type="number"
               id="targetResponseTime"
               value={targetResponseTimeMinutes}
               onChange={(e) => setTargetResponseTimeMinutes(e.target.value)}
               required
               min="1"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="예: 30"
             />
          </div>

          <div>
             <label htmlFor="targetResolutionTime" className="block text-sm font-medium text-text-secondary mb-2">
               목표 해결 시간 (분) <span className="text-danger">*</span>
             </label>
             <input
               type="number"
               id="targetResolutionTime"
               value={targetResolutionTimeMinutes}
               onChange={(e) => setTargetResolutionTimeMinutes(e.target.value)}
               required
               min="1"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="예: 240"
             />
          </div>
        </div>

        <div>
           <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
             설명
           </label>
           <textarea
             id="description"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             rows={4}
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             placeholder="SLA 정의에 대한 상세 설명을 입력하세요"
           />
        </div>

        <div className="flex items-center gap-2">
           <input
             type="checkbox"
             id="isActive"
             checked={isActive}
             onChange={(e) => setIsActive(e.target.checked)}
             className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
           />
           <label htmlFor="isActive" className="text-sm font-medium text-text-secondary">
             활성 상태
           </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "등록 중..." : "SLA 정의 등록"}
          </button>
           <Link
             href="/sla"
             className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken"
           >
             취소
           </Link>
        </div>
      </form>
    </div>
  );
}
