"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  inspectionsClient,
  type InspectionContract as Contract,
  type InspectionUser as User,
} from "../api";
import { INSPECTION_CYCLE_LABELS, optionsFromLabels } from "@/lib/labels";

const CYCLE_OPTIONS = optionsFromLabels(INSPECTION_CYCLE_LABELS);

export default function NewInspectionSchedulePage() {
  const router = useRouter();
  const [contractId, setContractId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch contracts and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsData, usersData] = await Promise.all([
          inspectionsClient.listContracts(),
          inspectionsClient.listUsers(),
        ]);
        setContracts(
          Array.isArray(contractsData) ? contractsData : contractsData.results || [],
        );
        setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("데이터를 불러올 수 없습니다");
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
      await inspectionsClient.createSchedule({
        contract: parseInt(contractId),
        equipment_type: equipmentType,
        cycle,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
        description,
        is_active: isActive,
      });
      router.push("/inspections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.last_name}${user.first_name} (${user.username})`;
    }
    return user.username;
  };

   if (isLoading) {
     return (
       <div className="p-6">
         <div className="text-center text-text-muted">로딩 중...</div>
       </div>
     );
   }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link href="/inspections" className="text-accent hover:underline text-sm">
           점검 스케줄 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">점검 스케줄 등록</h1>

         {error && (
           <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
             {error}
           </div>
         )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract */}
          <div>
             <label
               htmlFor="contract"
               className="block text-sm font-medium text-text mb-1"
             >
               사업 *
             </label>
             <select
               id="contract"
               value={contractId}
               onChange={(e) => setContractId(e.target.value)}
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

          {/* Equipment Type */}
          <div>
             <label
               htmlFor="equipmentType"
               className="block text-sm font-medium text-text mb-1"
             >
               장비 유형 *
             </label>
             <input
               id="equipmentType"
               type="text"
               value={equipmentType}
               onChange={(e) => setEquipmentType(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="예: 서버, 네트워크 장비, 스토리지"
             />
          </div>

          {/* Cycle */}
          <div>
             <label
               htmlFor="cycle"
               className="block text-sm font-medium text-text mb-1"
             >
               점검 주기 *
             </label>
             <select
               id="cycle"
               value={cycle}
               onChange={(e) => setCycle(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              {CYCLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
             <label
               htmlFor="assignedTo"
               className="block text-sm font-medium text-text mb-1"
             >
               담당자
             </label>
             <select
               id="assignedTo"
               value={assignedTo}
               onChange={(e) => setAssignedTo(e.target.value)}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              <option value="">담당자 선택</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
             <label
               htmlFor="description"
               className="block text-sm font-medium text-text mb-1"
             >
               설명
             </label>
             <textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               rows={4}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="점검 스케줄에 대한 설명을 입력하세요"
             />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
             <input
               id="isActive"
               type="checkbox"
               checked={isActive}
               onChange={(e) => setIsActive(e.target.checked)}
               className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
             />
             <label htmlFor="isActive" className="text-sm text-text">
               활성화 (체크 해제 시 자동 작업 생성 중단)
             </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !contractId || !equipmentType}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
             <Link
               href="/inspections"
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-text-secondary"
             >
               취소
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
