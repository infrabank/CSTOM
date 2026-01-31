"use client";

/**
 * Decision log form component.
 */

import { useState } from "react";
import { getAccessToken } from "@/lib/auth";

interface DecisionLogFormProps {
  taskId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function DecisionLogForm({
  taskId,
  onSuccess,
  onCancel,
}: DecisionLogFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      task: taskId,
      actor_role: formData.get("actor_role"),
      rationale_notes: formData.get("rationale_notes"),
      alternatives_considered: formData.get("alternatives_considered") === "on",
      risk_acknowledged: formData.get("risk_acknowledged") === "on",
      rationale_checklist: {},
    };

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/v1/decisions/`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Handle various error formats
        const message = 
          err?.error?.message ||
          err?.detail ||
          (typeof err === "string" ? err : null) ||
          (err?.error?.details ? JSON.stringify(err.error.details) : null) ||
          `판단 기록 등록에 실패했습니다 (${res.status})`;
        throw new Error(message);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="actor_role"
          className="block text-sm font-medium text-black mb-1"
        >
          결정 주체 *
        </label>
        <select
          id="actor_role"
          name="actor_role"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="pm">PM</option>
          <option value="engineer">엔지니어</option>
          <option value="joint">공동 결정</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="rationale_notes"
          className="block text-sm font-medium text-black mb-1"
        >
          판단 근거
        </label>
        <textarea
          id="rationale_notes"
          name="rationale_notes"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="이 판단의 근거를 설명하세요..."
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="alternatives_considered"
            className="rounded border-gray-300"
          />
          <span className="text-sm">대안 검토 완료</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="risk_acknowledged"
            className="rounded border-gray-300"
          />
          <span className="text-sm">리스크 인지 완료</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "등록 중..." : "판단 등록"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
