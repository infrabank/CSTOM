"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { eventsApi, EventListItem } from "@/lib/api";
import Modal from "@/components/modal";
import { EVENT_TYPE_LABELS, labelOf } from "@/lib/labels";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await eventsApi.listByContract(contractId);
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
      await eventsApi.link(eventId, selectedEventId);
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
      await eventsApi.unlink(eventId);
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
         className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
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
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
               취소
             </button>
             {currentRelatedEventId && (
               <button
                 onClick={handleUnlink}
                 disabled={isSubmitting}
                 className="px-4 py-2 bg-text-muted text-text-on-accent rounded-md hover:bg-text-secondary disabled:opacity-50"
               >
                 {isSubmitting ? "처리 중..." : "연결 해제"}
               </button>
             )}
            <button
              onClick={handleLink}
              disabled={isSubmitting || !selectedEventId}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "연결"}
            </button>
          </>
        }
      >
         {error && (
           <div className="mb-4 p-3 bg-danger-bg text-danger rounded-md text-sm">
             {error}
           </div>
         )}

         <p className="text-sm text-text-muted mb-4">
           같은 계약의 다른 이벤트를 선택하여 연결하세요.
         </p>

         {isLoading ? (
           <div className="py-8 text-center text-text-muted">불러오는 중...</div>
         ) : events.length === 0 ? (
           <div className="py-8 text-center text-text-muted">
             연결할 수 있는 이벤트가 없습니다.
           </div>
         ) : (
          <div className="max-h-64 overflow-y-auto border rounded-md">
            {events.map((event) => (
               <label
                 key={event.id}
                 className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-surface-sunken ${
                   selectedEventId === event.id ? "bg-info-bg" : ""
                 } ${
                   currentRelatedEventId === event.id ? "bg-success-bg" : ""
                 }`}
               >
                <input
                  type="radio"
                  name="relatedEvent"
                  value={event.id}
                  checked={selectedEventId === event.id}
                  onChange={() => setSelectedEventId(event.id)}
                  className="w-4 h-4 text-accent"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                     <span
                       className={`px-2 py-0.5 rounded text-xs font-medium ${
                         event.record_type === "incident"
                           ? "bg-danger-bg text-danger"
                           : "bg-info-bg text-info"
                       }`}
                     >
                      {labelOf(EVENT_TYPE_LABELS, event.record_type)}
                    </span>
                    <span className="font-medium">{event.title}</span>
                     {currentRelatedEventId === event.id && (
                       <span className="text-xs text-success">(현재 연결됨)</span>
                     )}
                  </div>
                   <div className="text-xs text-text-muted mt-1">
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
