import { cookies } from "next/headers";
import { Suspense } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import type { ContractListItem, PerformanceImprovement } from "@/lib/api";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  ImprovementFormIsland,
  ImprovementRowActions,
} from "./improvements-client";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ImprovementsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, acceptedHead, contractsPage] = await Promise.all([
    fetchPaginated<PerformanceImprovement>("/v1/sla/improvements/", {
      token,
      page,
    }),
    // Lightweight head request for the accepted-count summary card.
    fetchPaginated<PerformanceImprovement>("/v1/sla/improvements/", {
      token,
      page: 1,
      pageSize: 1,
      query: { is_accepted: "true" },
    }),
    fetchPaginated<ContractListItem>("/v1/contracts/", {
      token,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const items = data.results;
  const totalCount = data.count;
  const acceptedCount = acceptedHead.count;
  const contracts = contractsPage.results;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));

  function StatusBadge({ isAccepted }: { isAccepted: boolean }) {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          isAccepted
            ? "bg-success-bg text-success"
            : "bg-warning-bg text-warning"
        }`}
      >
        {isAccepted ? "승인" : "제안"}
      </span>
    );
  }

  const columns: Column<PerformanceImprovement>[] = [
    {
      key: "title",
      header: "제목",
      className: "text-text font-medium",
      render: (item) => item.title,
    },
    {
      key: "contract",
      header: "사업",
      className: "text-text-muted",
      render: (item) => item.contract_name,
    },
    {
      key: "proposed_by",
      header: "제안자",
      className: "text-text",
      render: (item) => item.proposed_by || "-",
    },
    {
      key: "proposed_date",
      header: "제안일",
      className: "text-text-muted",
      render: (item) => formatDate(item.proposed_date),
    },
    {
      key: "status",
      header: "상태",
      className: "text-center",
      render: (item) => <StatusBadge isAccepted={item.is_accepted} />,
    },
    {
      key: "actions",
      header: "작업",
      className: "text-center space-x-2",
      render: (item) => (
        <ImprovementRowActions id={item.id} isAccepted={item.is_accepted} />
      ),
    },
  ];

  const renderMobileCard = (item: PerformanceImprovement) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-2 border border-border-light">
      <div className="flex justify-between items-start">
        <span className="font-medium text-text text-sm">{item.title}</span>
        <StatusBadge isAccepted={item.is_accepted} />
      </div>
      <div className="text-xs text-text-muted">
        {item.contract_name} / {item.proposed_by || "-"}
      </div>
      <div className="text-xs text-text-secondary">
        {item.description.substring(0, 100)}
        {item.description.length > 100 ? "..." : ""}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted">{formatDate(item.proposed_date)}</span>
        <div className="space-x-2">
          <ImprovementRowActions
            id={item.id}
            isAccepted={item.is_accepted}
            compact
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />
      <ImprovementFormIsland contracts={contracts} />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">총 제안</div>
          <div className="text-xl font-semibold text-text mt-1">{totalCount}건</div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">승인됨</div>
          <div className="text-xl font-semibold text-success mt-1">
            {acceptedCount}건
          </div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">SLA 가점</div>
          <div className="text-xl font-semibold text-accent mt-1">
            +{acceptedCount}점
          </div>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
        <ResponsiveTable
          columns={columns}
          rows={items}
          rowKey={(item) => item.id}
          emptyMessage="등록된 성능개선 제안이 없습니다"
          renderMobileCard={renderMobileCard}
        />
      </Suspense>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
      />
    </div>
  );
}
