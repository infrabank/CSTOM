import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";

interface Task {
  id: number;
  contract: number;
  contract_name: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  approval_status: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getTasks(token?: string): Promise<Task[]> {
  try {
    const res = await fetch(`${API_URL}/v1/tasks/`, {
      next: { revalidate: 30 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const TYPE_LABELS: Record<string, string> = {
  routine: "정기",
  incident: "장애",
  change: "변경",
  request: "요청",
};

const TYPE_COLORS: Record<string, string> = {
  routine: "bg-surface-sunken text-text",
  incident: "bg-danger-bg text-danger",
  change: "bg-info-bg text-accent",
  request: "bg-accent-light text-accent",
};

const IMPACT_LABELS: Record<string, string> = {
  none: "없음",
  partial: "부분",
  full: "전체",
};

const IMPACT_COLORS: Record<string, string> = {
  none: "bg-surface-sunken text-text",
  partial: "bg-warning-bg text-warning",
  full: "bg-danger-bg text-danger",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_required: "-",
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  not_required: "text-text-muted",
  pending: "bg-warning-bg text-warning",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  const { filter } = await searchParams;
  
  let tasks = await getTasks(token);
  
  // Filter by approval status if requested
  if (filter === "pending") {
    tasks = tasks.filter((t) => t.approval_status === "pending");
  }

  const pendingCount = tasks.filter((t) => t.approval_status === "pending").length;
  
  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">작업 관리</h1>
        <Link
          href="/tasks/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          작업 등록
        </Link>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/tasks"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            !filter
              ? "bg-accent text-text-on-accent"
              : "bg-surface-sunken text-text-secondary hover:bg-surface-hover"
          }`}
        >
          전체
        </Link>
        <Link
          href="/tasks?filter=pending"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-warning text-text-on-accent"
              : "bg-surface-sunken text-text-secondary hover:bg-surface-hover"
          }`}
        >
          승인 대기 {pendingCount > 0 && `(${pendingCount})`}
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
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                영향도
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                승인
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  등록된 작업이 없습니다
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-accent hover:underline font-medium text-sm"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    <Link
                      href={`/contracts/${task.contract}`}
                      className="hover:underline"
                    >
                      {task.contract_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        TYPE_COLORS[task.task_type] || "bg-surface-sunken text-text"
                      }`}
                    >
                      {TYPE_LABELS[task.task_type] || task.task_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        IMPACT_COLORS[task.impact_level] ||
                        "bg-surface-sunken text-text"
                      }`}
                    >
                      {IMPACT_LABELS[task.impact_level] || task.impact_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.approval_required ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          APPROVAL_STATUS_COLORS[task.approval_status] || "bg-surface-sunken"
                        }`}
                      >
                        {APPROVAL_STATUS_LABELS[task.approval_status] || task.approval_status}
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {new Date(task.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 작업이 없습니다
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium text-accent block text-sm"
                >
                  {task.title}
                </Link>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    TYPE_COLORS[task.task_type] || "bg-surface-sunken text-text"
                  }`}
                >
                  {TYPE_LABELS[task.task_type] || task.task_type}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-border-light pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">사업</span>
                  <Link
                    href={`/contracts/${task.contract}`}
                    className="text-text-muted underline"
                  >
                    {task.contract_name}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-text-secondary">영향도</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      IMPACT_COLORS[task.impact_level] ||
                      "bg-surface-sunken text-text"
                    }`}
                  >
                    {IMPACT_LABELS[task.impact_level] || task.impact_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">승인</span>
                  {task.approval_required ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        APPROVAL_STATUS_COLORS[task.approval_status] || "bg-surface-sunken"
                      }`}
                    >
                      {APPROVAL_STATUS_LABELS[task.approval_status] || task.approval_status}
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">등록일</span>
                  <span className="text-text-muted">
                    {new Date(task.created_at).toLocaleDateString("ko-KR")}
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
