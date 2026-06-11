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
import { colorOf, labelOf } from "@/lib/labels";

interface AuditEvent {
  id: number;
  actor: number | null;
  actor_email: string | null;
  actor_role: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  occurred_at: string;
  ip_address: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  status_change: "상태 변경",
  approve: "승인",
  reject: "반려",
  login: "로그인",
  logout: "로그아웃",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-success-bg text-success",
  update: "bg-info-bg text-info",
  delete: "bg-danger-bg text-danger",
  status_change: "bg-warning-bg text-warning",
  approve: "bg-success-bg text-success",
  reject: "bg-danger-bg text-danger",
  login: "bg-surface-sunken text-text-muted",
  logout: "bg-surface-sunken text-text-muted",
};

const ENTITY_LABELS: Record<string, string> = {
  contract: "사업",
  task: "작업",
  event: "변경/장애",
  equipment: "장비",
  report: "보고서",
  user: "사용자",
  ticket: "티켓",
  sla: "SLA",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

function ActionBadge({ actionType }: { actionType: string }) {
  return (
    <StatusBadge
      label={labelOf(ACTION_LABELS, actionType)}
      colorClass={colorOf(ACTION_COLORS, actionType)}
    />
  );
}

export default async function AuditPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<AuditEvent>("/v1/audit/events/", {
    token,
    page,
  });
  const events = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const columns: Column<AuditEvent>[] = [
    {
      key: "occurred_at",
      header: "시각",
      className: "text-sm text-text-secondary whitespace-nowrap",
      render: (e) => new Date(e.occurred_at).toLocaleString("ko-KR"),
    },
    {
      key: "action",
      header: "작업",
      render: (e) => <ActionBadge actionType={e.action_type} />,
    },
    {
      key: "entity",
      header: "대상",
      className: "text-sm",
      render: (e) => (
        <>
          <span className="text-text">
            {labelOf(ENTITY_LABELS, e.entity_type)}
          </span>
          <span className="text-text-muted ml-1">#{e.entity_id}</span>
        </>
      ),
    },
    {
      key: "actor",
      header: "사용자",
      className: "text-sm text-text-secondary",
      render: (e) => e.actor_email || "-",
    },
    {
      key: "ip",
      header: "IP",
      className: "text-sm text-text-muted font-mono",
      render: (e) => e.ip_address || "-",
    },
  ];

  const renderMobileCard = (e: AuditEvent) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-2">
      <div className="flex items-center justify-between">
        <ActionBadge actionType={e.action_type} />
        <span className="text-xs text-text-muted">
          {new Date(e.occurred_at).toLocaleString("ko-KR")}
        </span>
      </div>
      <div className="text-sm">
        <span className="text-text font-medium">
          {labelOf(ENTITY_LABELS, e.entity_type)}
        </span>
        <span className="text-text-muted ml-1">#{e.entity_id}</span>
      </div>
      <div className="text-xs text-text-muted">
        {e.actor_email || "시스템"} {e.ip_address ? `(${e.ip_address})` : ""}
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">감사 로그</h1>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={events}
        rowKey={(e) => e.id}
        emptyMessage="감사 로그가 없습니다"
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
