"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tasksApi, Task } from "@/lib/api";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import Modal from "@/components/modal";

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_required: "승인 불필요",
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "반려됨",
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  not_required: "bg-surface-sunken text-text-secondary",
  pending: "bg-warning-bg text-warning",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

interface TaskApprovalSectionProps {
  task: Task;
}

export default function TaskApprovalSection({ task }: TaskApprovalSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = getCurrentUser();
  const canApprove = user && (user.role === "pm" || user.role === "admin");
  const isPending = task.approval_status === "pending";

  const handleOpenModal = (action: "approve" | "reject") => {
    setActionType(action);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      await tasksApi.approve(task.id, actionType, undefined, token || undefined);
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show this section if approval is required
  if (!task.approval_required) {
    return null;
  }

  return (
     <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">승인 상태</h2>

      <div className="flex items-center gap-4 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            APPROVAL_STATUS_COLORS[task.approval_status]
          }`}
        >
          {APPROVAL_STATUS_LABELS[task.approval_status] || task.approval_status}
        </span>

         {task.approval_status === "approved" && task.approved_by && (
           <span className="text-sm text-text-muted">
             {task.approved_by}님이{" "}
             {task.approved_at
               ? new Date(task.approved_at).toLocaleString("ko-KR")
               : ""}
             에 승인
           </span>
         )}

         {task.approval_status === "rejected" && task.approved_by && (
           <span className="text-sm text-text-muted">
             {task.approved_by}님이{" "}
             {task.approved_at
               ? new Date(task.approved_at).toLocaleString("ko-KR")
               : ""}
             에 반려
           </span>
         )}
      </div>

       {isPending && canApprove && (
         <div className="flex gap-3">
           <button
             onClick={() => handleOpenModal("approve")}
             className="px-4 py-2 bg-success text-text-on-accent rounded-md hover:bg-success/90 text-sm"
           >
             승인
           </button>
           <button
             onClick={() => handleOpenModal("reject")}
             className="px-4 py-2 bg-danger text-text-on-accent rounded-md hover:bg-danger/90 text-sm"
           >
             반려
           </button>
         </div>
       )}

       {isPending && !canApprove && (
         <p className="text-sm text-text-muted">
           PM 또는 관리자만 승인할 수 있습니다.
         </p>
       )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={actionType === "approve" ? "작업 승인" : "작업 반려"}
        footer={
          <>
             <button
               onClick={handleCloseModal}
               disabled={isSubmitting}
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
               취소
             </button>
             <button
               onClick={handleSubmit}
               disabled={isSubmitting}
               className={`px-4 py-2 text-text-on-accent rounded-md disabled:opacity-50 ${
                 actionType === "approve"
                   ? "bg-success hover:bg-success/90"
                   : "bg-danger hover:bg-danger/90"
               }`}
             >
              {isSubmitting
                ? "처리 중..."
                : actionType === "approve"
                ? "승인"
                : "반려"}
            </button>
          </>
        }
      >
         {error && (
           <div className="mb-4 p-3 bg-danger-bg text-danger rounded-md text-sm">
             {error}
           </div>
         )}
         <p>
           이 작업을 {actionType === "approve" ? "승인" : "반려"}하시겠습니까?
         </p>
         <p className="text-sm text-text-muted mt-2">
           작업: {task.title}
         </p>
      </Modal>
    </div>
  );
}
