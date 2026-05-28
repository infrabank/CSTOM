import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

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

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger",
  high: "bg-warning-bg text-warning",
  medium: "bg-warning-bg text-warning",
  low: "bg-success-bg text-success",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-info-bg text-accent",
  in_progress: "bg-accent-light text-accent",
  resolved: "bg-success-bg text-success",
  closed: "bg-surface-sunken text-text-muted",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<Ticket>("/v1/tickets/", { token, page });
  const tickets = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">티켓 관리</h1>
        <Link
          href="/tickets/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          새 티켓 생성
        </Link>
      </div>

      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                우선순위
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                요청자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                생성일
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  등록된 티켓이 없습니다
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-accent hover:underline font-medium text-sm"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[ticket.priority] || "bg-surface-sunken text-text-muted"}`}>
                      {ticket.priority_display}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status] || "bg-surface-sunken text-text-muted"}`}>
                      {ticket.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {ticket.requester_name}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {ticket.assigned_to_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
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
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 티켓이 없습니다
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <Link
                href={`/tickets/${ticket.id}`}
                className="font-medium text-accent block hover:underline text-sm"
              >
                {ticket.title}
              </Link>

              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${PRIORITY_COLORS[ticket.priority] || "bg-surface-sunken text-text-muted"}`}>
                  {ticket.priority_display}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[ticket.status] || "bg-surface-sunken text-text-muted"}`}>
                  {ticket.status_display}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-border-light pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">요청자</span>
                  <span className="text-text-muted">{ticket.requester_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">담당자</span>
                  <span className="text-text-muted">{ticket.assigned_to_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">생성일</span>
                  <span className="text-text-muted">
                    {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
