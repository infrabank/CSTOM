"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ConfirmModal from "@/components/confirm-modal";
import { createSchedule, deleteSchedule } from "./actions";

export const SCHEDULE_TYPES = [
  { value: "work", label: "근무" },
  { value: "vacation", label: "휴가" },
  { value: "training", label: "교육" },
  { value: "sick_leave", label: "병가" },
  { value: "other", label: "기타" },
];

interface EngineerOption {
  id: number;
  user: number;
  user_name: string;
}

/**
 * Client island for the workforce schedule header, create form, and filter
 * controls. Creation goes through a server action; filters update searchParams
 * so the server component re-fetches the filtered, paginated list.
 */
export function ScheduleControls({
  engineers,
  filterEngineer,
  filterDateFrom,
  filterDateTo,
}: {
  engineers: EngineerOption[];
  filterEngineer: string;
  filterDateFrom: string;
  filterDateTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSchedule(formData);
      if (result.success) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "일정 등록에 실패했습니다");
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/workforce"
            className="text-accent hover:underline text-sm"
          >
            인력 관리로
          </Link>
          <h1 className="text-2xl font-semibold text-text mt-1">일정 관리</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          {showForm ? "닫기" : "일정 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-surface shadow-card rounded-lg p-6 mb-6 border border-border-light">
          <h2 className="text-lg font-semibold mb-4">일정 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="form-engineer"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  엔지니어 <span className="text-danger">*</span>
                </label>
                <select
                  id="form-engineer"
                  name="engineer"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">선택하세요</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.user}>
                      {eng.user_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="form-date"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  날짜 <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  id="form-date"
                  name="date"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="form-type"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  유형 <span className="text-danger">*</span>
                </label>
                <select
                  id="form-type"
                  name="schedule_type"
                  defaultValue="work"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {SCHEDULE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="form-notes"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  비고
                </label>
                <input
                  type="text"
                  id="form-notes"
                  name="notes"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="메모 입력"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isPending ? "등록 중..." : "등록"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface shadow-card rounded-lg p-4 mb-6 border border-border-light">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="filter-engineer"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              엔지니어
            </label>
            <select
              id="filter-engineer"
              value={filterEngineer}
              onChange={(e) => updateFilter("engineer", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            >
              <option value="">전체</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.user}>
                  {eng.user_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-from"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              시작일
            </label>
            <input
              type="date"
              id="filter-from"
              value={filterDateFrom}
              onChange={(e) => updateFilter("date_from", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="filter-to"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              종료일
            </label>
            <input
              type="date"
              id="filter-to"
              value={filterDateTo}
              onChange={(e) => updateFilter("date_to", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function ScheduleDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSchedule(id);
      setConfirmDelete(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setConfirmDelete(true)}
        disabled={isPending}
        className="text-danger hover:underline text-sm disabled:opacity-50"
      >
        삭제
      </button>

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="일정 삭제"
        message="이 일정을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={isPending}
        isDestructive
      />
    </>
  );
}
