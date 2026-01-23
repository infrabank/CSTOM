"use client";

/**
 * Decision log form component.
 */

import { useState } from "react";

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
      const res = await fetch(`${API_URL}/decisions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to create decision log");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
          Decision Maker
        </label>
        <select
          id="actor_role"
          name="actor_role"
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="pm">Project Manager</option>
          <option value="engineer">Engineer</option>
          <option value="joint">Joint Decision</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="rationale_notes"
          className="block text-sm font-medium text-black mb-1"
        >
          Rationale / Notes
        </label>
        <textarea
          id="rationale_notes"
          name="rationale_notes"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="Explain the reasoning behind this decision..."
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="alternatives_considered"
            className="rounded border-gray-300"
          />
          <span className="text-sm">Alternatives Considered</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="risk_acknowledged"
            className="rounded border-gray-300"
          />
          <span className="text-sm">Risk Acknowledged</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Decision Log"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
