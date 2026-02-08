import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

interface Event {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  occurred_at: string;
  resolved_at: string | null;
  customer_notified: boolean;
  has_related: boolean;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/v1/events/`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const TYPE_LABELS: Record<string, string> = {
  change: "변경",
  incident: "장애",
};

const TYPE_COLORS: Record<string, string> = {
  change: "bg-info-bg text-accent",
  incident: "bg-danger-bg text-danger",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">변경/장애 관리</h1>
        <Link
          href="/events/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          이벤트 등록
        </Link>
      </div>

      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                발생 시각
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                통보
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  등록된 이벤트가 없습니다
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        TYPE_COLORS[event.record_type]
                      }`}
                    >
                      {TYPE_LABELS[event.record_type] || event.record_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/events/${event.id}`}
                      className="text-accent hover:underline"
                    >
                      {event.title}
                    </Link>
                    {event.has_related && (
                      <span className="ml-2 text-xs text-text-muted">연결됨</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {event.contract_name}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {new Date(event.occurred_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-6 py-4">
                    {event.resolved_at ? (
                      <span className="text-success text-sm">해결됨</span>
                    ) : (
                      <span className="text-warning text-sm">진행 중</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {event.customer_notified ? (
                      <span className="text-success">완료</span>
                    ) : (
                      <span className="text-text-muted">미통보</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {events.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 이벤트가 없습니다
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        TYPE_COLORS[event.record_type]
                      }`}
                    >
                      {TYPE_LABELS[event.record_type] || event.record_type}
                    </span>
                    {event.has_related && (
                      <span className="text-xs text-text-muted border border-border-light px-1 rounded">
                        연결됨
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium text-accent block text-sm"
                  >
                    {event.title}
                  </Link>
                </div>
                {event.resolved_at ? (
                  <span className="text-success text-sm font-medium">
                    해결됨
                  </span>
                ) : (
                  <span className="text-warning text-sm font-medium">
                    진행 중
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-border-light pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">사업</span>
                  <span className="text-text-muted">{event.contract_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">발생 시각</span>
                  <span className="text-text-muted">
                    {new Date(event.occurred_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">통보</span>
                  {event.customer_notified ? (
                    <span className="text-success">완료</span>
                  ) : (
                    <span className="text-text-muted">미통보</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
