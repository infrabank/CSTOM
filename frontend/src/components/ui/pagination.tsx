"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const pages: (number | "...")[] = [];
  const showEllipsisStart = currentPage > 3;
  const showEllipsisEnd = currentPage < totalPages - 2;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (showEllipsisStart) {
      pages.push("...");
    }
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    if (showEllipsisEnd) {
      pages.push("...");
    }
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-text-muted">
        {totalItems !== undefined && `총 ${totalItems}개`}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || isPending}
          className="px-3 py-1.5 rounded-md border border-border text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors cursor-pointer min-h-[36px]"
        >
          이전
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-text-muted">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-md text-sm min-h-[36px] transition-colors cursor-pointer ${
                page === currentPage
                  ? "bg-accent text-text-on-accent font-medium"
                  : "border border-border text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || isPending}
          className="px-3 py-1.5 rounded-md border border-border text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors cursor-pointer min-h-[36px]"
        >
          다음
        </button>
      </div>
    </div>
  );
}
