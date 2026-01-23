import Link from "next/link";
import { notFound } from "next/navigation";

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

interface DecisionLog {
  id: number;
  task: number;
  actor_role: string;
  rationale_checklist: Record<string, boolean>;
  rationale_notes: string;
  alternatives_considered: boolean;
  risk_acknowledged: boolean;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getTask(id: number): Promise<Task | null> {
  try {
    const res = await fetch(`${API_URL}/tasks/${id}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getDecisions(taskId: number): Promise<DecisionLog[]> {
  try {
    const res = await fetch(`${API_URL}/decisions/?task=${taskId}`, {
      cache: "no-store",
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

const IMPACT_LABELS: Record<string, string> = {
  none: "없음",
  partial: "부분 영향",
  full: "전체 영향",
};

const IMPACT_COLORS: Record<string, string> = {
  none: "bg-gray-100 text-gray-800",
  partial: "bg-yellow-100 text-yellow-700",
  full: "bg-red-100 text-red-700",
};

const ACTOR_LABELS: Record<string, string> = {
  pm: "PM",
  engineer: "엔지니어",
  joint: "공동 결정",
};

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const { taskId } = await params;
  const id = parseInt(taskId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const [task, decisions] = await Promise.all([getTask(id), getDecisions(id)]);

  if (!task) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/contracts/${task.contract}`}
          className="text-blue-600 hover:underline text-sm"
        >
          {task.contract_name}으로 돌아가기
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-gray-800">{task.contract_name}</p>
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                IMPACT_COLORS[task.impact_level]
              }`}
            >
              {IMPACT_LABELS[task.impact_level] || task.impact_level}
            </span>
            {task.approval_required && (
              <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
                승인 필요
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">작업 유형</h3>
            <p>{TYPE_LABELS[task.task_type] || task.task_type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700">등록일</h3>
            <p>{new Date(task.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </div>

        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">상세 내용</h3>
            <p className="text-gray-800 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">판단 기록</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            판단 추가
          </button>
        </div>

        {decisions.length === 0 ? (
          <p className="text-gray-700 text-center py-8">
            기록된 판단이 없습니다
          </p>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">
                    {ACTOR_LABELS[decision.actor_role] || decision.actor_role}
                  </span>
                  <span className="text-sm text-gray-700">
                    {new Date(decision.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>

                {decision.rationale_notes && (
                  <p className="text-gray-800 mb-3">{decision.rationale_notes}</p>
                )}

                <div className="flex gap-4 text-sm">
                  <span
                    className={
                      decision.alternatives_considered
                        ? "text-green-600"
                        : "text-gray-700"
                    }
                  >
                    {decision.alternatives_considered ? "O" : "X"} 대안 검토
                  </span>
                  <span
                    className={
                      decision.risk_acknowledged
                        ? "text-green-600"
                        : "text-gray-700"
                    }
                  >
                    {decision.risk_acknowledged ? "O" : "X"} 리스크 인지
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
