"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventsApi, EventListItem } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import Modal from "@/components/modal";

const TYPE_LABELS: Record<string, string> = {
  change: "변경",
  incident: "장애",
};

interface EventLinkButtonProps {
  eventId: number;
  contractId: number;
  currentRelatedEventId: number | null;
}

export default function EventLinkButton({
  eventId,
  contractId,
  currentRelatedEventId,
}: EventLinkButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      loadEvents();
    }
  }, [isModalOpen]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAccessToken();
      const response = await eventsApi.listByContract(contractId, token || undefined);
      // Filter out current event
      const filteredEvents = response.results.filter((e) => e.id !== eventId);
      setEvents(filteredEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이벤트 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedEventId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      await eventsApi.link(eventId, selectedEventId, token || undefined);
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "연결 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      await eventsApi.unlink(eventId, token || undefined);
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "연결 해제 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        {currentRelatedEventId ? "연관 이벤트 변경" : "연관 이벤트 연결"}
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="연관 이벤트 연결"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            {currentRelatedEventId && (
              <button
                onClick={handleUnlink}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {isSubmitting ? "처리 중..." : "연결 해제"}
              </button>
            )}
            <button
              onClick={handleLink}
              disabled={isSubmitting || !selectedEventId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "연결"}
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          같은 계약의 다른 이벤트를 선택하여 연결하세요.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">불러오는 중...</div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            연결할 수 있는 이벤트가 없습니다.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto border rounded-md">
            {events.map((event) => (
              <label
                key={event.id}
                className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                  selectedEventId === event.id ? "bg-blue-50" : ""
                } ${
                  currentRelatedEventId === event.id ? "bg-green-50" : ""
                }`}
              >
                <input
                  type="radio"
                  name="relatedEvent"
                  value={event.id}
                  checked={selectedEventId === event.id}
                  onChange={() => setSelectedEventId(event.id)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        event.record_type === "incident"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {TYPE_LABELS[event.record_type] || event.record_type}
                    </span>
                    <span className="font-medium">{event.title}</span>
                    {currentRelatedEventId === event.id && (
                      <span className="text-xs text-green-600">(현재 연결됨)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.occurred_at).toLocaleString("ko-KR")}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
