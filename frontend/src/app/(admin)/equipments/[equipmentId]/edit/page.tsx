"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { equipmentsApi, contractsApi, Equipment, ContractListItem } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "server", label: "서버" },
  { value: "network", label: "네트워크 장비" },
  { value: "storage", label: "스토리지" },
  { value: "security", label: "보안 장비" },
  { value: "pc", label: "PC/워크스테이션" },
  { value: "other", label: "기타" },
];

const STATUS_OPTIONS = [
  { value: "available", label: "보관중" },
  { value: "maintenance", label: "점검중" },
  { value: "retired", label: "폐기" },
];

export default function EditEquipmentPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = Number(params.equipmentId);

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipmentData, contractsData] = await Promise.all([
          equipmentsApi.get(equipmentId),
          contractsApi.list(),
        ]);
        setEquipment(equipmentData);
        setContracts(contractsData.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [equipmentId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await equipmentsApi.update(equipmentId, {
        contract: Number(formData.get("contract")),
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        serial_number: formData.get("serial_number") as string,
        model_name: formData.get("model_name") as string,
        manufacturer: formData.get("manufacturer") as string,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      });
      router.push(`/equipments/${equipmentId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "장비 수정에 실패했습니다");
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

  if (error && !equipment) {
    return (
       <div className="p-6">
         <div className="text-center text-danger">{error}</div>
       </div>
     );
   }

   if (!equipment) {
     return (
       <div className="p-6">
         <div className="text-center text-danger">장비를 찾을 수 없습니다</div>
       </div>
     );
   }

  // Equipment status can only be edited if not checked_out
  const canEditStatus = equipment.status !== "checked_out";

  return (
    <div className="p-6 max-w-2xl mx-auto">
       <div className="mb-6">
         <Link href={`/equipments/${equipmentId}`} className="text-accent hover:underline">
          &larr; 상세보기로
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">장비 수정</h1>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error}
        </div>
      )}

      <div className="bg-surface shadow-card rounded-lg p-6">
        <form action={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-text mb-1">
               사업 *
             </label>
             <select
               name="contract"
               required
               defaultValue={equipment.contract}
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
             <label className="block text-sm font-medium text-text mb-1">
               장비명 *
             </label>
             <input
               type="text"
               name="name"
               required
               defaultValue={equipment.name}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 분류 *
               </label>
               <select
                 name="category"
                 required
                 defaultValue={equipment.category}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 시리얼번호 *
               </label>
               <input
                 type="text"
                 name="serial_number"
                 required
                 defaultValue={equipment.serial_number}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 모델명
               </label>
               <input
                 type="text"
                 name="model_name"
                 defaultValue={equipment.model_name}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 제조사
               </label>
               <input
                 type="text"
                 name="manufacturer"
                 defaultValue={equipment.manufacturer}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               보관 위치
             </label>
             <input
               type="text"
               name="location"
               defaultValue={equipment.location}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           {canEditStatus && (
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 상태
               </label>
               <select
                 name="status"
                 defaultValue={equipment.status}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
               <p className="mt-1 text-sm text-text">
                 * 반출중인 장비는 반입 처리 후 상태 변경이 가능합니다.
               </p>
            </div>
          )}

          {!canEditStatus && (
            <div className="p-3 bg-warning-bg border border-warning-border rounded-md">
              <p className="text-sm text-warning">
                현재 반출중인 장비입니다. 반입 처리 후 상태 변경이 가능합니다.
              </p>
            </div>
          )}

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               비고
             </label>
             <textarea
               name="notes"
               rows={3}
               defaultValue={equipment.notes}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div className="flex gap-4">
             <Link
               href={`/equipments/${equipmentId}`}
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
