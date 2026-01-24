import Link from "next/link";

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
    const res = await fetch(`${API_URL}/events/`, { cache: "no-store" });
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
  change: "bg-blue-100 text-blue-700",
  incident: "bg-red-100 text-red-700",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">변경/장애 관리</h1>
        <Link
          href="/events/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          이벤트 등록
        </Link>
      </div>

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                유형
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                제목
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                발생 시각
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                통보
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  등록된 이벤트가 없습니다
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
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
                      className="text-blue-600 hover:underline"
                    >
                      {event.title}
                    </Link>
                    {event.has_related && (
                      <span className="ml-2 text-xs text-black">연결됨</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-black">
                    {event.contract_name}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {new Date(event.occurred_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-6 py-4">
                    {event.resolved_at ? (
                      <span className="text-green-600 text-sm">해결됨</span>
                    ) : (
                      <span className="text-orange-600 text-sm">진행 중</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {event.customer_notified ? (
                      <span className="text-green-600">완료</span>
                    ) : (
                      <span className="text-black">미통보</span>
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
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 이벤트가 없습니다
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
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
                      <span className="text-xs text-black border border-gray-200 px-1 rounded">
                        연결됨
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium text-blue-600 block"
                  >
                    {event.title}
                  </Link>
                </div>
                {event.resolved_at ? (
                  <span className="text-green-600 text-sm font-medium">
                    해결됨
                  </span>
                ) : (
                  <span className="text-orange-600 text-sm font-medium">
                    진행 중
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">사업</span>
                  <span className="text-black">{event.contract_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">발생 시각</span>
                  <span className="text-black">
                    {new Date(event.occurred_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">통보</span>
                  {event.customer_notified ? (
                    <span className="text-green-600">완료</span>
                  ) : (
                    <span className="text-black">미통보</span>
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
