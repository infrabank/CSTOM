import Link from "next/link";
import { cookies } from "next/headers";

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
      cache: "no-store",
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
  routine: "bg-gray-100 text-black",
  incident: "bg-red-100 text-red-700",
  change: "bg-blue-100 text-blue-700",
  request: "bg-purple-100 text-purple-700",
};

const IMPACT_LABELS: Record<string, string> = {
  none: "없음",
  partial: "부분",
  full: "전체",
};

const IMPACT_COLORS: Record<string, string> = {
  none: "bg-gray-100 text-black",
  partial: "bg-yellow-100 text-yellow-700",
  full: "bg-red-100 text-red-700",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_required: "-",
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  not_required: "text-gray-400",
  pending: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">작업 관리</h1>
        <Link
          href="/tasks/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          전체
        </Link>
        <Link
          href="/tasks?filter=pending"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-orange-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          승인 대기 {pendingCount > 0 && `(${pendingCount})`}
        </Link>
      </div>

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                제목
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                유형
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                영향도
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                승인
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  등록된 작업이 없습니다
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
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
                        TYPE_COLORS[task.task_type] || "bg-gray-100 text-black"
                      }`}
                    >
                      {TYPE_LABELS[task.task_type] || task.task_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        IMPACT_COLORS[task.impact_level] ||
                        "bg-gray-100 text-black"
                      }`}
                    >
                      {IMPACT_LABELS[task.impact_level] || task.impact_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.approval_required ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          APPROVAL_STATUS_COLORS[task.approval_status] || "bg-gray-100"
                        }`}
                      >
                        {APPROVAL_STATUS_LABELS[task.approval_status] || task.approval_status}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
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
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 작업이 없습니다
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium text-blue-600 block"
                >
                  {task.title}
                </Link>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    TYPE_COLORS[task.task_type] || "bg-gray-100 text-black"
                  }`}
                >
                  {TYPE_LABELS[task.task_type] || task.task_type}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">사업</span>
                  <Link
                    href={`/contracts/${task.contract}`}
                    className="text-black underline"
                  >
                    {task.contract_name}
                  </Link>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-black">영향도</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      IMPACT_COLORS[task.impact_level] ||
                      "bg-gray-100 text-black"
                    }`}
                  >
                    {IMPACT_LABELS[task.impact_level] || task.impact_level}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">승인</span>
                  {task.approval_required ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        APPROVAL_STATUS_COLORS[task.approval_status] || "bg-gray-100"
                      }`}
                    >
                      {APPROVAL_STATUS_LABELS[task.approval_status] || task.approval_status}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">등록일</span>
                  <span className="text-black">
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
