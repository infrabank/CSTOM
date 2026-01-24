"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateTask } from "../../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
}

interface Task {
  id: number;
  contract: number;
  contract_name: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  title: string;
  description: string;
}

const TASK_TYPES = [
  { value: "routine", label: "정기" },
  { value: "incident", label: "장애" },
  { value: "change", label: "변경" },
  { value: "request", label: "요청" },
];

const IMPACT_LEVELS = [
  { value: "none", label: "없음" },
  { value: "partial", label: "부분 영향" },
  { value: "full", label: "전체 영향" },
];

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export default function EditTaskPage({ params }: PageProps) {
  const { taskId } = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [taskRes, contractsRes] = await Promise.all([
          fetch(`${API_URL}/tasks/${taskId}/`, { cache: "no-store" }),
          fetch(`${API_URL}/contracts/`, { cache: "no-store" }),
        ]);

        if (!taskRes.ok) throw new Error("작업 정보를 불러오지 못했습니다");
        const taskData = await taskRes.json();
        setTask(taskData);

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "작업 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [taskId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateTask(parseInt(taskId, 10), formData);

    if (result.success) {
      router.push(`/tasks/${taskId}`);
    } else {
      setError(result.error || "작업 수정에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-black">불러오는 중...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error || "작업을 찾을 수 없습니다"}
        </div>
        <Link href="/tasks" className="text-blue-600 hover:underline">
          작업 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/tasks/${taskId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          작업 상세로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">작업 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="contract" className="block text-sm font-medium text-black mb-1">
              사업 *
            </label>
            <select
              id="contract"
              name="contract"
              required
              defaultValue={task.contract}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">사업 선택</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              defaultValue={task.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task_type" className="block text-sm font-medium text-black mb-1">
                작업 유형 *
              </label>
              <select
                id="task_type"
                name="task_type"
                required
                defaultValue={task.task_type}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TASK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="impact_level" className="block text-sm font-medium text-black mb-1">
                영향도 *
              </label>
              <select
                id="impact_level"
                name="impact_level"
                required
                defaultValue={task.impact_level}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {IMPACT_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
              상세 내용
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={task.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {task.approval_required && (
            <p className="text-sm text-orange-600">
              이 작업은 승인이 필요합니다.
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
            <Link
              href={`/tasks/${taskId}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
