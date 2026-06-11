import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  labelOf,
  colorOf,
} from "@/lib/labels";

interface InspectionTask {
  id: number;
  schedule: number;
  equipment_type: string;
  contract_name: string;
  scheduled_date: string;
  assigned_to_name: string;
  status: "pending" | "in_progress" | "completed";
  result_count: number;
  created_at: string;
}

const STATUS_VALUES = new Set(["pending", "in_progress", "completed"]);

function TaskStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={labelOf(INSPECTION_STATUS_LABELS, status)}
      colorClass={colorOf(INSPECTION_STATUS_COLORS, status)}
    />
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function InspectionTasksPage({ searchParams }: PageProps) {
  const { page: pageRaw, status: statusRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const status = statusRaw && STATUS_VALUES.has(statusRaw) ? statusRaw : undefined;

  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, counts] = await Promise.all([
    fetchPaginated<InspectionTask>("/v1/inspections/tasks/", {
      token,
      page,
      query: status ? { status } : {},
    }),
    Promise.all([
      fetchPaginated<InspectionTask>("/v1/inspections/tasks/", {
        token,
        page: 1,
        pageSize: 1,
      }),
      fetchPaginated<InspectionTask>("/v1/inspections/tasks/", {
        token,
        page: 1,
        pageSize: 1,
        query: { status: "pending" },
      }),
      fetchPaginated<InspectionTask>("/v1/inspections/tasks/", {
        token,
        page: 1,
        pageSize: 1,
        query: { status: "in_progress" },
      }),
      fetchPaginated<InspectionTask>("/v1/inspections/tasks/", {
        token,
        page: 1,
        pageSize: 1,
        query: { status: "completed" },
      }),
    ]),
  ]);

  const tasks = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));
  const [allHead, pendingHead, progressHead, completedHead] = counts;

  const filterTabs = [
    { label: "전체", value: undefined, count: allHead.count, href: "/inspections/tasks" },
    { label: "대기", value: "pending", count: pendingHead.count, href: "/inspections/tasks?status=pending" },
    { label: "진행중", value: "in_progress", count: progressHead.count, href: "/inspections/tasks?status=in_progress" },
    { label: "완료", value: "completed", count: completedHead.count, href: "/inspections/tasks?status=completed" },
  ];

  const columns: Column<InspectionTask>[] = [
    {
      key: "equipment_type",
      header: "장비 유형",
      render: (task) => (
        <Link
          href={`/inspections/tasks/${task.id}`}
          className="text-accent hover:underline font-medium"
        >
          {task.equipment_type}
        </Link>
      ),
    },
    {
      key: "contract_name",
      header: "사업",
      className: "text-text text-sm",
      render: (task) => task.contract_name,
    },
    {
      key: "scheduled_date",
      header: "예정일",
      className: "text-text text-sm",
      render: (task) =>
        new Date(task.scheduled_date).toLocaleDateString("ko-KR"),
    },
    {
      key: "assigned_to_name",
      header: "담당자",
      className: "text-text text-sm",
      render: (task) => task.assigned_to_name,
    },
    {
      key: "status",
      header: "상태",
      render: (task) => <TaskStatusBadge status={task.status} />,
    },
    {
      key: "result_count",
      header: "결과",
      className: "text-text text-sm text-center",
      render: (task) => task.result_count,
    },
    {
      key: "created_at",
      header: "등록일",
      className: "text-text text-sm",
      render: (task) => new Date(task.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (task: InspectionTask) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Link
            href={`/inspections/tasks/${task.id}`}
            className="font-medium text-accent block"
          >
            {task.equipment_type}
          </Link>
          <div className="text-sm text-text">{task.contract_name}</div>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text">예정일</span>
          <span className="text-text">
            {new Date(task.scheduled_date).toLocaleDateString("ko-KR")}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">담당자</span>
          <span className="text-text">{task.assigned_to_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">결과</span>
          <span className="text-text">{task.result_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">등록일</span>
          <span className="text-text">
            {new Date(task.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">점검 작업</h1>
        <Link
          href="/inspections/tasks/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover text-sm"
        >
          점검 작업 등록
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border-light">
        {filterTabs.map((tab) => (
          <Link
            key={tab.value ?? "all"}
            href={tab.href}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              status === tab.value
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      <ResponsiveTable
        columns={columns}
        rows={tasks}
        rowKey={(task) => task.id}
        emptyMessage="등록된 점검 작업이 없습니다"
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
