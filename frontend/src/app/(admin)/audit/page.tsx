import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

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

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">감사 로그</h1>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                시각
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                작업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                대상
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                사용자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  감사 로그가 없습니다
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                    {new Date(e.occurred_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        ACTION_COLORS[e.action_type] || "bg-surface-sunken text-text-muted"
                      }`}
                    >
                      {ACTION_LABELS[e.action_type] || e.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-text">
                      {ENTITY_LABELS[e.entity_type] || e.entity_type}
                    </span>
                    <span className="text-text-muted ml-1">#{e.entity_id}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {e.actor_email || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted font-mono">
                    {e.ip_address || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {events.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            감사 로그가 없습니다
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    ACTION_COLORS[e.action_type] || "bg-surface-sunken text-text-muted"
                  }`}
                >
                  {ACTION_LABELS[e.action_type] || e.action_type}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(e.occurred_at).toLocaleString("ko-KR")}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-text font-medium">
                  {ENTITY_LABELS[e.entity_type] || e.entity_type}
                </span>
                <span className="text-text-muted ml-1">#{e.entity_id}</span>
              </div>
              <div className="text-xs text-text-muted">
                {e.actor_email || "시스템"} {e.ip_address ? `(${e.ip_address})` : ""}
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
