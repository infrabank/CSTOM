"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ContractListItem } from "@/lib/api";
import { createRevisionRequest, reviewRevisionRequest } from "./actions";

/**
 * Client islands for the SLA revision-request page: the create-form toggle in
 * the header and the per-item review form. Mutations go through server actions;
 * the server component re-renders via router.refresh().
 */

export function RevisionFormIsland({
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
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createRevisionRequest(formData);
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
        <h1 className="text-2xl font-semibold text-text">SLA 개정요청</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "개정요청 등록"}
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
              <label className="block text-sm font-medium text-text mb-1">요청일</label>
              <input
                type="date"
                name="request_date"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">요청자</label>
              <input
                type="text"
                name="requester_name"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">소속</label>
              <input
                type="text"
                name="requester_department"
                required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">문서명</label>
              <input
                type="text"
                name="document_name"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">해당조항</label>
              <input
                type="text"
                name="section_reference"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">개정사유</label>
              <textarea
                name="revision_reason"
                required
                rows={2}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">개정 전 내용</label>
              <textarea
                name="content_before"
                required
                rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">개정 후 내용</label>
              <textarea
                name="content_after"
                required
                rows={3}
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

export function RevisionReviewIsland({ id }: { id: number }) {
  const router = useRouter();
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await reviewRevisionRequest(id, formData);
      if (result.success) {
        setReviewing(false);
        router.refresh();
      } else {
        setError(result.error ?? "검토 처리에 실패했습니다");
      }
    });
  };

  if (!reviewing) {
    return (
      <button
        onClick={() => setReviewing(true)}
        className="text-sm text-accent hover:underline cursor-pointer"
      >
        검토하기
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border-light pt-3 space-y-3"
    >
      {error && (
        <div className="p-3 bg-danger-bg text-danger rounded-md border border-danger-border text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-text mb-1">검토자</label>
          <input
            type="text"
            name="reviewer_name"
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text mb-1">검토자 소속</label>
          <input
            type="text"
            name="reviewer_department"
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-text mb-1">검토의견</label>
        <textarea
          name="review_opinion"
          rows={2}
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text mb-1">검토결과</label>
        <select
          name="review_result"
          required
          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text"
        >
          <option value="">선택</option>
          <option value="approved">개정</option>
          <option value="needs_review">추가검토</option>
          <option value="rejected">의견반려</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setReviewing(false)}
          disabled={isPending}
          className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-surface-hover cursor-pointer disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-accent text-text-on-accent rounded-md text-sm hover:bg-accent-hover cursor-pointer disabled:opacity-50"
        >
          {isPending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
