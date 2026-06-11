"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/confirm-modal";
import type { ContractListItem } from "@/lib/api";
import {
  createImprovement,
  acceptImprovement,
  deleteImprovement,
} from "./actions";

/**
 * Client island for the create-form toggle (header) and the per-row
 * accept/delete actions. Mutations go through server actions; the server
 * component re-renders via router.refresh().
 */

export function ImprovementFormIsland({
  contracts,
}: {
  contracts: ContractListItem[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createImprovement(formData);
      if (result.success) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "저장에 실패했습니다");
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">성능개선 제안</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "개선안 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface shadow-card rounded-lg p-6 border border-border-light mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">사업</label>
              <select
                name="contract"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              >
                <option value="">선택</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">제안자</label>
              <input
                type="text"
                name="proposed_by"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">제목</label>
              <input
                type="text"
                name="title"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">내용</label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">제안일</label>
              <input
                type="date"
                name="proposed_date"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                평가기간 시작
              </label>
              <input
                type="date"
                name="evaluation_period_start"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export function ImprovementRowActions({
  id,
  isAccepted,
  compact = false,
}: {
  id: number;
  isAccepted: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      await acceptImprovement(id);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteImprovement(id);
      setConfirmDelete(false);
      router.refresh();
    });
  };

  return (
    <>
      {!isAccepted && (
        <button
          onClick={handleAccept}
          disabled={isPending}
          className={`text-accent hover:underline cursor-pointer disabled:opacity-50 ${
            compact ? "" : "text-xs"
          }`}
        >
          승인
        </button>
      )}
      <button
        onClick={() => setConfirmDelete(true)}
        disabled={isPending}
        className={`text-danger hover:underline cursor-pointer disabled:opacity-50 ${
          compact ? "" : "text-xs"
        }`}
      >
        삭제
      </button>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="개선안 삭제"
        message="이 성능개선 제안을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={isPending}
        isDestructive
      />
    </>
  );
}
