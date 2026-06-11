import { cookies } from "next/headers";
import { Suspense } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { ContractListItem, SLARevisionRequest } from "@/lib/api";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import { RevisionFormIsland, RevisionReviewIsland } from "./revisions-client";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const RESULT_STYLES: Record<string, string> = {
  approved: "bg-success-bg text-success",
  needs_review: "bg-warning-bg text-warning",
  rejected: "bg-danger-bg text-danger",
  "": "bg-surface-sunken text-text-muted",
};

const RESULT_LABELS: Record<string, string> = {
  approved: "개정",
  needs_review: "추가검토",
  rejected: "의견반려",
  "": "대기",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function RevisionsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, contractsPage] = await Promise.all([
    fetchPaginated<SLARevisionRequest>("/v1/sla/revision-requests/", {
      token,
      page,
    }),
    fetchPaginated<ContractListItem>("/v1/contracts/", {
      token,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const items = data.results;
  const contracts = contractsPage.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  return (
    <div>
      <Breadcrumb />
      <RevisionFormIsland contracts={contracts} />

      <Suspense fallback={<TableSkeleton rows={4} columns={1} />}>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-surface p-8 rounded-lg shadow-card text-center text-text-muted border border-border-light">
              등록된 SLA 개정요청이 없습니다
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-surface rounded-lg shadow-card border border-border-light"
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-text">{item.revision_reason}</div>
                      <div className="text-sm text-text-muted mt-1">
                        {item.requester_name} ({item.requester_department}) /{" "}
                        {formatDate(item.request_date)}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        RESULT_STYLES[item.review_result] || RESULT_STYLES[""]
                      }`}
                    >
                      {RESULT_LABELS[item.review_result] || RESULT_LABELS[""]}
                    </span>
                  </div>

                  {(item.document_name || item.section_reference) && (
                    <div className="text-xs text-text-muted">
                      {item.document_name && <span>문서: {item.document_name}</span>}
                      {item.section_reference && (
                        <span className="ml-2">조항: {item.section_reference}</span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-danger-bg rounded-md p-3">
                      <div className="text-xs font-medium text-danger mb-1">개정 전</div>
                      <div className="text-sm text-text whitespace-pre-wrap">
                        {item.content_before}
                      </div>
                    </div>
                    <div className="bg-success-bg rounded-md p-3">
                      <div className="text-xs font-medium text-success mb-1">개정 후</div>
                      <div className="text-sm text-text whitespace-pre-wrap">
                        {item.content_after}
                      </div>
                    </div>
                  </div>

                  {item.review_opinion && (
                    <div className="bg-surface-sunken rounded-md p-3">
                      <div className="text-xs font-medium text-text-muted mb-1">검토의견</div>
                      <div className="text-sm text-text">{item.review_opinion}</div>
                      <div className="text-xs text-text-muted mt-1">
                        {item.reviewer_name} ({item.reviewer_department}) /{" "}
                        {item.review_date && formatDate(item.review_date)}
                      </div>
                    </div>
                  )}

                  {!item.review_result && <RevisionReviewIsland id={item.id} />}
                </div>
              </div>
            ))
          )}
        </div>
      </Suspense>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
