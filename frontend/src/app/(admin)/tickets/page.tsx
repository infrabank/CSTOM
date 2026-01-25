import Link from "next/link";
import { cookies } from "next/headers";

interface Ticket {
  id: number;
  title: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  requester_name: string;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

async function getTickets(token?: string): Promise<Ticket[]> {
  try {
    const res = await fetch(`${API_URL}/v1/tickets/`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export default async function TicketsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  
  const tickets = await getTickets(token);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">티켓 관리</h1>
        <Link
          href="/tickets/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          새 티켓 생성
        </Link>
      </div>

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                제목
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                요청자
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                생성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  등록된 티켓이 없습니다
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-800"}`}>
                      {ticket.priority_display}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-800"}`}>
                      {ticket.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {ticket.requester_name}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {ticket.assigned_to_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {tickets.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 티켓이 없습니다
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <Link
                href={`/tickets/${ticket.id}`}
                className="font-medium text-blue-600 block hover:underline"
              >
                {ticket.title}
              </Link>

              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-800"}`}>
                  {ticket.priority_display}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-800"}`}>
                  {ticket.status_display}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">요청자</span>
                  <span className="text-black">{ticket.requester_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">담당자</span>
                  <span className="text-black">{ticket.assigned_to_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">생성일</span>
                  <span className="text-black">
                    {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
