import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  TICKET_PRIORITY_COLORS,
  TICKET_STATUS_COLORS,
  colorOf,
} from "@/lib/labels";

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

  const columns: Column<Ticket>[] = [
    {
      key: "title",
      header: "제목",
      render: (ticket) => (
        <Link
          href={`/tickets/${ticket.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {ticket.title}
        </Link>
      ),
    },
    {
      key: "priority",
      header: "우선순위",
      render: (ticket) => (
        <StatusBadge
          label={ticket.priority_display}
          colorClass={colorOf(TICKET_PRIORITY_COLORS, ticket.priority)}
        />
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (ticket) => (
        <StatusBadge
          label={ticket.status_display}
          colorClass={colorOf(TICKET_STATUS_COLORS, ticket.status)}
        />
      ),
    },
    {
      key: "requester_name",
      header: "요청자",
      className: "text-text-secondary text-sm",
      render: (ticket) => ticket.requester_name,
    },
    {
      key: "assigned_to_name",
      header: "담당자",
      className: "text-text-secondary text-sm",
      render: (ticket) => ticket.assigned_to_name || "-",
    },
    {
      key: "created_at",
      header: "생성일",
      className: "text-text-secondary text-sm",
      render: (ticket) =>
        new Date(ticket.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (ticket: Ticket) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <Link
        href={`/tickets/${ticket.id}`}
        className="font-medium text-accent block hover:underline text-sm"
      >
        {ticket.title}
      </Link>

      <div className="flex gap-2">
        <StatusBadge
          label={ticket.priority_display}
          colorClass={colorOf(TICKET_PRIORITY_COLORS, ticket.priority)}
        />
        <StatusBadge
          label={ticket.status_display}
          colorClass={colorOf(TICKET_STATUS_COLORS, ticket.status)}
        />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">요청자</span>
          <span className="text-text-muted">{ticket.requester_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">담당자</span>
          <span className="text-text-muted">
            {ticket.assigned_to_name || "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">생성일</span>
          <span className="text-text-muted">
            {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

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

      <ResponsiveTable
        columns={columns}
        rows={tickets}
        rowKey={(ticket) => ticket.id}
        emptyMessage="등록된 티켓이 없습니다"
        renderMobileCard={renderMobileCard}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
