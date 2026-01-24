"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTask } from "../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
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

export default function NewTaskPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch(`${API_URL}/contracts/`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setContracts(data.results || []);
        }
      } catch {
      }
    }
    fetchContracts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createTask(formData);

    if (result.success) {
      router.push(`/tasks/${result.id}`);
    } else {
      setError(result.error || "작업 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/tasks" className="text-blue-600 hover:underline text-sm">
          작업 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">작업 등록</h1>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-sm text-black">
            * 영향도가 &quot;전체 영향&quot;이거나 작업 유형이 &quot;변경&quot;인 경우 자동으로 승인 필요로 설정됩니다.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
            <Link
              href="/tasks"
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
