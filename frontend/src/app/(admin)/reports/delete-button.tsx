"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/confirm-modal";
import { deleteReport } from "./actions";

interface DeleteButtonProps {
  reportId: number;
}

export default function DeleteButton({ reportId }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    const result = await deleteReport(reportId);

    if (result.success) {
      router.push("/reports");
    } else {
      setError(result.error || "삭제에 실패했습니다");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </button>

      {error && (
        <span className="text-red-600 text-sm ml-2">{error}</span>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="보고서 삭제"
        message="정말 이 보고서를 삭제하시겠습니까?"
        confirmText="삭제"
        isDestructive
        isLoading={isDeleting}
      />
    </>
  );
}
