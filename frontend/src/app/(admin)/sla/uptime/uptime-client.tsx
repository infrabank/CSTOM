"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/confirm-modal";
import type { ContractListItem, EquipmentListItem } from "@/lib/api";
import { createUptimeRecord, deleteUptimeRecord } from "./actions";

/**
 * Client island: create-form toggle (header) and per-row delete action.
 * Mutations go through server actions; the server component re-renders via
 * router.refresh().
 */

export function UptimeFormIsland({
  contracts,
  equipments,
}: {
  contracts: ContractListItem[];
  equipments: EquipmentListItem[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createUptimeRecord(formData);
      if (result.success) {
        form.reset();
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
        <h1 className="text-2xl font-semibold text-text">가동율 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "가동율 등록"}
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
              <label className="block text-sm font-medium text-text mb-1">장비</label>
              <select
                name="equipment"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              >
                <option value="">선택</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.category_display})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">기간 시작</label>
              <input
                type="date"
                name="period_start"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">기간 종료</label>
              <input
                type="date"
                name="period_end"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">총 운영시간</label>
              <input
                type="number"
                step="0.01"
                name="total_operating_hours"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">비계획 중단시간</label>
              <input
                type="number"
                step="0.01"
                name="unplanned_downtime_hours"
                defaultValue="0"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">중단 사유</label>
            <input
              type="text"
              name="downtime_reason"
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
            />
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

export function UptimeDeleteButton({
  id,
  compact = false,
}: {
  id: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteUptimeRecord(id);
      setConfirmDelete(false);
      router.refresh();
    });
  };

  return (
    <>
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
        title="가동율 기록 삭제"
        message="이 가동율 기록을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={isPending}
        isDestructive
      />
    </>
  );
}
