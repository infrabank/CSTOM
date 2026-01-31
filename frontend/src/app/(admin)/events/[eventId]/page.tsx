import Link from "next/link";
import { notFound } from "next/navigation";
import EventDeleteButton from "./event-delete-button";
import EventLinkButton from "./event-link-button";

interface Event {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  description: string;
  occurred_at: string;
  detected_at: string | null;
  resolved_at: string | null;
  customer_notified: boolean;
  customer_notified_at: string | null;
  related_event: number | null;
  related_event_title: string | null;
  summary_notice: string;
  audit_summary: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getEvent(id: number): Promise<Event | null> {
  try {
    const res = await fetch(`${API_URL}/v1/events/${id}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const TYPE_LABELS: Record<string, string> = {
  change: "변경",
  incident: "장애",
};

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const id = parseInt(eventId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const typeColor =
    event.record_type === "incident"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/events" className="text-blue-600 hover:underline text-sm">
          이벤트 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${typeColor}`}>
                {TYPE_LABELS[event.record_type] || event.record_type}
              </span>
              <h1 className="text-2xl font-bold">{event.title}</h1>
            </div>
            <p className="text-black">{event.contract_name}</p>
          </div>
          <div>
            {event.resolved_at ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                해결됨
              </span>
            ) : (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                진행 중
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-black">발생 시각</h3>
            <p>{new Date(event.occurred_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">인지 시각</h3>
            <p>
              {event.detected_at
                ? new Date(event.detected_at).toLocaleString("ko-KR")
                : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">해결 시각</h3>
            <p>
              {event.resolved_at
                ? new Date(event.resolved_at).toLocaleString("ko-KR")
                : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black">고객 통보</h3>
            <p>
              {event.customer_notified
                ? event.customer_notified_at
                  ? new Date(event.customer_notified_at).toLocaleString("ko-KR")
                  : "완료"
                : "미통보"}
            </p>
          </div>
        </div>

        {event.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-black mb-1">상세 내용</h3>
            <p className="text-black whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {event.related_event && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-black mb-1">연관 이벤트</h3>
            <Link
              href={`/events/${event.related_event}`}
              className="text-blue-600 hover:underline"
            >
              {event.related_event_title}
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">1차 공지 요약</h2>
          <pre className="text-sm text-black whitespace-pre-wrap font-sans">
            {event.summary_notice || "요약이 생성되지 않았습니다"}
          </pre>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">감사 보고 요약</h2>
          <pre className="text-sm text-black whitespace-pre-wrap font-sans">
            {event.audit_summary || "요약이 생성되지 않았습니다"}
          </pre>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/events/${event.id}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          수정
        </Link>
        <EventLinkButton
          eventId={event.id}
          contractId={event.contract}
          currentRelatedEventId={event.related_event}
        />
        <EventDeleteButton eventId={event.id} eventTitle={event.title} />
      </div>
    </div>
  );
}
