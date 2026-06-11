import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { ContractListItem } from "@/lib/api";
import SearchInput from "@/components/ui/search-input";
import FilterSelect from "@/components/ui/filter-select";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/ui/breadcrumb";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import { fetchPaginated, parsePageParam } from "@/lib/fetch-paginated";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_OPTIONS,
  colorOf,
  labelOf,
} from "@/lib/labels";

const ITEMS_PER_PAGE = 10;

function ContractStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={labelOf(CONTRACT_STATUS_LABELS, status)}
      colorClass={colorOf(CONTRACT_STATUS_COLORS, status)}
      size="sm"
    />
  );
}

function RiskIndicators({
  flags,
}: {
  flags?: ContractListItem["risk_flags"];
}) {
  if (!flags) return null;

  const risks = [];
  if (flags.pre_env) risks.push("환경");
  if (flags.prior_vendor_coordination) risks.push("협업");
  if (flags.docs_incomplete) risks.push("문서");

  if (risks.length === 0) return null;

  return (
    <div className="flex gap-1">
      {risks.map((risk) => (
        <span
          key={risk}
          className="px-1.5 py-0.5 bg-danger-bg text-danger text-xs rounded border border-danger-border"
        >
          {risk}
        </span>
      ))}
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const search = (params.search as string) || "";
  const statusFilter = (params.status as string) || "";
  const page = parsePageParam(params.page as string | undefined);

  const data = await fetchPaginated<ContractListItem>("/v1/contracts/", {
    token,
    page,
    pageSize: ITEMS_PER_PAGE,
    query: {
      search: search || undefined,
      status: statusFilter || undefined,
    },
  });
  const contracts = data.results;
  const totalItems = data.count;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const emptyMessage =
    search || statusFilter ? "검색 결과가 없습니다" : "등록된 사업이 없습니다";

  const columns: Column<ContractListItem>[] = [
    {
      key: "name",
      header: "사업명",
      render: (c) => (
        <Link
          href={`/contracts/${c.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {c.name}
        </Link>
      ),
    },
    {
      key: "client_org",
      header: "발주처",
      className: "text-text-secondary text-sm",
      render: (c) => c.client_org,
    },
    {
      key: "period",
      header: "기간",
      className: "text-text-secondary text-sm",
      render: (c) => `${c.start_date} ~ ${c.end_date}`,
    },
    {
      key: "status",
      header: "상태",
      render: (c) => <ContractStatusBadge status={c.status} />,
    },
    {
      key: "risk",
      header: "리스크",
      render: (c) => <RiskIndicators flags={c.risk_flags} />,
    },
  ];

  const renderMobileCard = (contract: ContractListItem) => {
    const hasRisk =
      contract.risk_flags &&
      (contract.risk_flags.pre_env ||
        contract.risk_flags.prior_vendor_coordination ||
        contract.risk_flags.docs_incomplete);
    return (
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Link
              href={`/contracts/${contract.id}`}
              className="font-medium text-accent block text-sm"
            >
              {contract.name}
            </Link>
            <div className="text-sm text-text-muted">{contract.client_org}</div>
          </div>
          <ContractStatusBadge status={contract.status} />
        </div>

        <div className="space-y-2 text-sm border-t border-border-light pt-3">
          <div className="flex justify-between">
            <span className="font-medium text-text-secondary">기간</span>
            <span className="text-text-muted">
              {contract.start_date} ~ {contract.end_date}
            </span>
          </div>
          {hasRisk && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-text-secondary">리스크</span>
              <RiskIndicators flags={contract.risk_flags} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text">사업 관리</h1>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          사업 등록
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-md">
          <Suspense fallback={<div className="h-10 bg-surface-sunken rounded-md animate-pulse" />}>
            <SearchInput placeholder="사업명, 발주처 검색..." />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-10 w-32 bg-surface-sunken rounded-md animate-pulse" />}>
          <FilterSelect
            options={CONTRACT_STATUS_OPTIONS}
            paramName="status"
            placeholder="전체 상태"
          />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton rows={5} columns={5} />}>
        <ResponsiveTable
          columns={columns}
          rows={contracts}
          rowKey={(c) => c.id}
          emptyMessage={emptyMessage}
          renderMobileCard={renderMobileCard}
        />
      </Suspense>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
      />
    </div>
  );
}
