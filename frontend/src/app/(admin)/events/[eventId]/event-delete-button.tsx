"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import Modal from "@/components/modal";

interface EventDeleteButtonProps {
  eventId: number;
  eventTitle: string;
}

export default function EventDeleteButton({
  eventId,
  eventTitle,
}: EventDeleteButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = getAccessToken();
      await eventsApi.delete(eventId, token || undefined);
      router.push("/events");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        삭제
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="이벤트 삭제"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isDeleting}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <p>이 이벤트를 삭제하시겠습니까?</p>
        <p className="text-sm text-gray-500 mt-2">
          이벤트: {eventTitle}
        </p>
        <p className="text-sm text-red-500 mt-2">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </Modal>
    </>
  );
}
