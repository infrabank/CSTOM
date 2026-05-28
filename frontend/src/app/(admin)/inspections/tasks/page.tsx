import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  in_progress: "bg-info-bg text-info",
  completed: "bg-success-bg text-success",
};

const STATUS_VALUES = new Set(["pending", "in_progress", "completed"]);

function StatusBadge({ status }: { status: string }) {
   const colorClass = STATUS_COLORS[status] || "bg-surface-sunken text-text-muted";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
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

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                장비 유형
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                예정일
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                결과
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-text">
                  등록된 점검 작업이 없습니다
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-surface-sunken">
                  <td className="px-6 py-4">
                    <Link
                      href={`/inspections/tasks/${task.id}`}
                      className="text-accent hover:underline font-medium"
                    >
                      {task.equipment_type}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text text-sm">
                    {task.contract_name}
                  </td>
                  <td className="px-6 py-4 text-text text-sm">
                    {new Date(task.scheduled_date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 text-text text-sm">
                    {task.assigned_to_name}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-6 py-4 text-text text-sm text-center">
                    {task.result_count}
                  </td>
                  <td className="px-6 py-4 text-text text-sm">
                    {new Date(task.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text">
            등록된 점검 작업이 없습니다
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-surface rounded-lg shadow-card p-4 space-y-3"
            >
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
                <StatusBadge status={task.status} />
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
