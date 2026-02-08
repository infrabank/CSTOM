"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import { getAccessToken } from "@/lib/auth";
import { deleteContract } from "./actions";

interface DeleteContractButtonProps {
  contractId: number;
  contractName: string;
  className?: string;
  isIcon?: boolean;
}

export default function DeleteContractButton({
  contractId,
  contractName,
  className,
  isIcon = false,
}: DeleteContractButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const token = getAccessToken();
    const result = await deleteContract(contractId, token ?? undefined);
    
    if (result.success) {
      setIsOpen(false);
      router.push("/contracts");
      router.refresh();
    } else {
      alert(result.error || "삭제에 실패했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <>
       <button
         onClick={() => setIsOpen(true)}
         className={className || "px-4 py-2 text-danger border border-danger-border rounded-md hover:bg-danger-bg hover:border-danger-border transition-colors"}
         type="button"
       >
        {isIcon ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ) : (
          "삭제"
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !isDeleting && setIsOpen(false)}
        title="사업 삭제"
        footer={
          <>
             <button
               onClick={() => setIsOpen(false)}
               disabled={isDeleting}
               className="px-4 py-2 text-text bg-surface border border-border rounded-md hover:bg-surface-sunken focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border disabled:opacity-50"
             >
               취소
             </button>
             <button
               onClick={handleDelete}
               disabled={isDeleting}
               className="px-4 py-2 text-text-on-accent bg-danger rounded-md hover:bg-danger/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger disabled:opacity-50 flex items-center gap-2"
             >
              {isDeleting ? (
                <>
                   <svg className="animate-spin h-4 w-4 text-text-on-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>삭제 중...</span>
                </>
              ) : (
                "삭제"
              )}
            </button>
          </>
        }
      >
         <div className="space-y-3">
           <p className="text-text">
             정말로 <span className="font-semibold text-text">{contractName}</span> 사업을 삭제하시겠습니까?
           </p>
           <p className="text-sm text-danger bg-danger-bg p-3 rounded-md border border-danger-border">
             이 작업은 되돌릴 수 없으며, 관련된 모든 데이터가 영구적으로 삭제됩니다.
           </p>
         </div>
      </Modal>
    </>
  );
}
