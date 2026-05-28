import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  sla_breach: "SLA 위반",
  task_assigned: "작업 배정",
  incident_created: "장애 발생",
  approval_required: "승인 필요",
  system: "시스템",
};

const TYPE_COLORS: Record<string, string> = {
  sla_breach: "bg-danger-bg text-danger",
  incident_created: "bg-danger-bg text-danger",
  approval_required: "bg-warning-bg text-warning",
  task_assigned: "bg-info-bg text-info",
  system: "bg-surface-sunken text-text-muted",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<Notification>("/v1/notifications/", {
    token,
    page,
  });
  const notifications = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">알림</h1>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-surface p-8 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            알림이 없습니다
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-surface rounded-lg shadow-card border p-4 ${
                n.is_read
                  ? "border-border-light"
                  : "border-accent bg-accent-light/30"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        TYPE_COLORS[n.type] || "bg-surface-sunken text-text-muted"
                      }`}
                    >
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-accent rounded-full" />
                    )}
                  </div>
                  <h3 className="font-medium text-text text-sm">{n.title}</h3>
                  <p className="text-text-muted text-sm mt-1 line-clamp-2">
                    {n.content}
                  </p>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {new Date(n.created_at).toLocaleDateString("ko-KR")}
                </span>
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
