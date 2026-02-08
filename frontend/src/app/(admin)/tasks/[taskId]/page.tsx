import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { tasksApi, Task, DecisionLog } from "@/lib/api";
import TaskDecisionSection from "./task-decision-section";
import TaskApprovalSection from "./task-approval-section";
import Breadcrumb from "@/components/ui/breadcrumb";

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
  none: "bg-surface-sunken text-text",
  partial: "bg-warning-bg text-warning",
  full: "bg-danger-bg text-danger",
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

  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let task: Task | null = null;
  let decisions: DecisionLog[] = [];

  try {
    const [taskData, decisionsData] = await Promise.all([
      tasksApi.get(id, token),
      tasksApi.decisions(id, token),
    ]);
    task = taskData;
    decisions = decisionsData.results || [];
  } catch {
    notFound();
  }

  if (!task) {
    notFound();
  }

  return (
    <div>
      <Breadcrumb />
      <div className="mb-6 flex justify-between items-center">
        <Link
          href={`/contracts/${task.contract}`}
          className="text-accent hover:underline text-sm"
        >
          {task.contract_name}으로 돌아가기
        </Link>
        <Link
          href={`/tasks/${taskId}/edit`}
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover text-sm"
        >
          수정
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">{task.title}</h1>
            <p className="text-text">{task.contract_name}</p>
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
              <span className="px-3 py-1 rounded-full text-sm bg-warning-bg text-warning">
                승인 필요
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-medium text-text">작업 유형</h3>
            <p>{TYPE_LABELS[task.task_type] || task.task_type}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">등록일</h3>
            <p>{new Date(task.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </div>

        {task.description && (
          <div>
            <h3 className="text-sm font-medium text-text mb-1">상세 내용</h3>
            <p className="text-text whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
      </div>

      <TaskApprovalSection task={task} />

      <TaskDecisionSection taskId={id} decisions={decisions} />
    </div>
  );
}
