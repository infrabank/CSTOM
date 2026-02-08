"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import { updateContractStatus } from "./actions";

const STATUS_OPTIONS = [
  { value: "pre-handover", label: "인수 전" },
  { value: "handover", label: "인수" },
  { value: "stabilization", label: "안정화" },
  { value: "steady", label: "정상 운영" },
  { value: "closed", label: "종료" },
];

interface StatusChangeButtonProps {
  contractId: number;
  currentStatus: string;
}

export default function StatusChangeButton({
  contractId,
  currentStatus,
}: StatusChangeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === currentStatus) {
      setError("현재 상태와 동일합니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateContractStatus(contractId, selectedStatus, notes || undefined);

    if (result.success) {
      setIsOpen(false);
      setNotes("");
      router.refresh();
    } else {
      setError(result.error || "상태 변경에 실패했습니다.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
       <button
         onClick={() => setIsOpen(true)}
         className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
         type="button"
       >
         상태 변경
       </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title="사업 상태 변경"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           {error && (
             <div className="p-3 bg-danger-bg text-danger rounded-md text-sm">
               {error}
             </div>
           )}

           <div>
             <label className="block text-sm font-medium text-text mb-2">
               상태 선택
             </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                 <label
                   key={option.value}
                   className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                     selectedStatus === option.value
                       ? "border-accent bg-info-bg"
                       : "border-border-light hover:bg-surface-sunken"
                   }`}
                 >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3"
                  />
                   <span className="text-text">{option.label}</span>
                   {option.value === currentStatus && (
                     <span className="ml-2 text-xs text-text-muted">(현재)</span>
                   )}
                </label>
              ))}
            </div>
          </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               변경 사유 (선택)
             </label>
             <textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={3}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="상태 변경 사유를 입력하세요"
             />
          </div>

          <div className="flex gap-3 pt-2">
             <button
               type="button"
               onClick={() => setIsOpen(false)}
               disabled={isSubmitting}
               className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-surface-sunken disabled:opacity-50"
             >
               취소
             </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedStatus === currentStatus}
              className="flex-1 px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? "변경 중..." : "변경"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
