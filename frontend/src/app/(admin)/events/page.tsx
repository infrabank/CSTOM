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
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  colorOf,
  labelOf,
} from "@/lib/labels";

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

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

function TypeBadge({ recordType }: { recordType: string }) {
  return (
    <StatusBadge
      label={labelOf(EVENT_TYPE_LABELS, recordType)}
      colorClass={colorOf(EVENT_TYPE_COLORS, recordType)}
      size="sm"
    />
  );
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<Event>("/v1/events/", { token, page });
  const events = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const columns: Column<Event>[] = [
    {
      key: "type",
      header: "유형",
      render: (event) => <TypeBadge recordType={event.record_type} />,
    },
    {
      key: "title",
      header: "제목",
      render: (event) => (
        <>
          <Link
            href={`/events/${event.id}`}
            className="text-accent hover:underline"
          >
            {event.title}
          </Link>
          {event.has_related && (
            <span className="ml-2 text-xs text-text-muted">연결됨</span>
          )}
        </>
      ),
    },
    {
      key: "contract",
      header: "사업",
      className: "text-text-secondary",
      render: (event) => event.contract_name,
    },
    {
      key: "occurred_at",
      header: "발생 시각",
      className: "text-text-secondary text-sm",
      render: (event) => new Date(event.occurred_at).toLocaleString("ko-KR"),
    },
    {
      key: "status",
      header: "상태",
      render: (event) =>
        event.resolved_at ? (
          <span className="text-success text-sm">해결됨</span>
        ) : (
          <span className="text-warning text-sm">진행 중</span>
        ),
    },
    {
      key: "notified",
      header: "통보",
      render: (event) =>
        event.customer_notified ? (
          <span className="text-success">완료</span>
        ) : (
          <span className="text-text-muted">미통보</span>
        ),
    },
  ];

  const renderMobileCard = (event: Event) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TypeBadge recordType={event.record_type} />
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
          <span className="text-success text-sm font-medium">해결됨</span>
        ) : (
          <span className="text-warning text-sm font-medium">진행 중</span>
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
  );

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

      <ResponsiveTable
        columns={columns}
        rows={events}
        rowKey={(event) => event.id}
        emptyMessage="등록된 이벤트가 없습니다"
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
