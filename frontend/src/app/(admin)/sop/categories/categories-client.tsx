"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/confirm-modal";
import { createCategory, deleteCategory } from "./actions";

interface ParentOption {
  id: number;
  name: string;
}

/**
 * Client island for the SOP category create-form toggle (header) and the
 * per-row delete action. Mutations go through server actions; the server
 * component re-renders via router.refresh().
 */
export function CategoryFormIsland({
  parentOptions,
}: {
  parentOptions: ParentOption[];
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
      const result = await createCategory(formData);
      if (result.success) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "등록에 실패했습니다");
      }
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/sop" className="text-accent hover:underline text-sm">
            SOP 목록으로
          </Link>
          <h1 className="text-2xl font-semibold text-text mt-1">
            SOP 카테고리 관리
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          {showForm ? "닫기" : "카테고리 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-surface shadow-card rounded-lg p-6 mb-6 border border-border-light">
          <h2 className="text-lg font-semibold mb-4">카테고리 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="form-name"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  이름 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="form-name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="예: 장애대응, 보안, 백업/복구"
                />
              </div>

              <div>
                <label
                  htmlFor="form-parent"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  상위 카테고리
                </label>
                <select
                  id="form-parent"
                  name="parent"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">없음 (최상위)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="form-desc"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                설명
              </label>
              <input
                type="text"
                id="form-desc"
                name="description"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="카테고리 설명 (선택)"
              />
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
    </>
  );
}

export function CategoryDeleteButton({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCategory(id);
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
        title="카테고리 삭제"
        message={`"${name}" 카테고리를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={isPending}
        isDestructive
      />
    </>
  );
}
