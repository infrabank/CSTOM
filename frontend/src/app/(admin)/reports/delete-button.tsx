"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReport } from "./actions";

interface DeleteButtonProps {
  reportId: number;
}

export default function DeleteButton({ reportId }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("정말 이 보고서를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteReport(reportId);

    if (result.success) {
      router.push("/reports");
    } else {
      alert(result.error || "삭제에 실패했습니다");
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
    >
      {isDeleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
