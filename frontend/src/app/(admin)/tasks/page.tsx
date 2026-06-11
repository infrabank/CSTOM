import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
  TASK_IMPACT_LABELS,
  TASK_IMPACT_COLORS,
  TASK_APPROVAL_STATUS_LABELS,
  TASK_APPROVAL_STATUS_COLORS,
  colorOf,
  labelOf,
} from "@/lib/labels";

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

interface PageProps {
  searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  const { filter, page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);

  const isPendingFilter = filter === "pending";

  const [listPage, pendingHead] = await Promise.all([
    fetchPaginated<Task>("/v1/tasks/", {
      token,
      page,
      query: isPendingFilter ? { approval_status: "pending" } : {},
    }),
    // Lightweight head request to know the badge count without paginating.
    isPendingFilter
      ? Promise.resolve(null)
      : fetchPaginated<Task>("/v1/tasks/", {
          token,
          page: 1,
          pageSize: 1,
          query: { approval_status: "pending" },
        }),
  ]);

  const tasks = listPage.results;
  const totalPages = Math.max(1, Math.ceil(listPage.count / DEFAULT_PAGE_SIZE));
  const pendingCount = isPendingFilter
    ? listPage.count
    : (pendingHead?.count ?? 0);

  function TypeBadge({ task }: { task: Task }) {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colorOf(
          TASK_TYPE_COLORS,
          task.task_type,
          "bg-surface-sunken text-text",
        )}`}
      >
        {labelOf(TASK_TYPE_LABELS, task.task_type)}
      </span>
    );
  }

  function ImpactBadge({ task, sm }: { task: Task; sm?: boolean }) {
    return (
      <span
        className={`px-2 ${sm ? "py-0.5" : "py-1"} rounded-full text-xs font-medium ${colorOf(
          TASK_IMPACT_COLORS,
          task.impact_level,
          "bg-surface-sunken text-text",
        )}`}
      >
        {labelOf(TASK_IMPACT_LABELS, task.impact_level)}
      </span>
    );
  }

  function ApprovalCell({ task, sm }: { task: Task; sm?: boolean }) {
    if (!task.approval_required) {
      return <span className="text-text-muted text-sm">-</span>;
    }
    return (
      <span
        className={`px-2 ${sm ? "py-0.5" : "py-1"} rounded-full text-xs font-medium ${colorOf(
          TASK_APPROVAL_STATUS_COLORS,
          task.approval_status,
          "bg-surface-sunken",
        )}`}
      >
        {labelOf(TASK_APPROVAL_STATUS_LABELS, task.approval_status)}
      </span>
    );
  }

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "제목",
      render: (task) => (
        <Link
          href={`/tasks/${task.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {task.title}
        </Link>
      ),
    },
    {
      key: "contract",
      header: "사업",
      className: "text-text-secondary text-sm",
      render: (task) => (
        <Link href={`/contracts/${task.contract}`} className="hover:underline">
          {task.contract_name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "유형",
      render: (task) => <TypeBadge task={task} />,
    },
    {
      key: "impact",
      header: "영향도",
      render: (task) => <ImpactBadge task={task} />,
    },
    {
      key: "approval",
      header: "승인",
      render: (task) => <ApprovalCell task={task} />,
    },
    {
      key: "created_at",
      header: "등록일",
      className: "text-text-secondary text-sm",
      render: (task) => new Date(task.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (task: Task) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Link
          href={`/tasks/${task.id}`}
          className="font-medium text-accent block text-sm"
        >
          {task.title}
        </Link>
        <TypeBadge task={task} />
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
          <ImpactBadge task={task} sm />
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">승인</span>
          {task.approval_required ? (
            <ApprovalCell task={task} sm />
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
  );

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

      <ResponsiveTable
        columns={columns}
        rows={tasks}
        rowKey={(task) => task.id}
        emptyMessage="등록된 작업이 없습니다"
        renderMobileCard={renderMobileCard}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={listPage.count}
      />
    </div>
  );
}
