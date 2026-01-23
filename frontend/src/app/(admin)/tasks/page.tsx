import Link from "next/link";

interface Task {
  id: number;
  contract: number;
  contract_name: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getTasks(): Promise<Task[]> {
  try {
    const res = await fetch(`${API_URL}/tasks/`, { cache: "no-store" });
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
  routine: "bg-gray-100 text-gray-800",
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
  none: "bg-gray-100 text-gray-800",
  partial: "bg-yellow-100 text-yellow-700",
  full: "bg-red-100 text-red-700",
};

export default async function TasksPage() {
  const tasks = await getTasks();

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

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                영향도
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                승인
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-700">
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
                  <td className="px-6 py-4 text-gray-800 text-sm">
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
                        TYPE_COLORS[task.task_type] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {TYPE_LABELS[task.task_type] || task.task_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        IMPACT_COLORS[task.impact_level] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {IMPACT_LABELS[task.impact_level] || task.impact_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {task.approval_required ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        필요
                      </span>
                    ) : (
                      <span className="text-gray-700 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-800 text-sm">
                    {new Date(task.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
