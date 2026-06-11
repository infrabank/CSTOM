import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { EquipmentListItem } from "@/lib/api";
import SearchInput from "@/components/ui/search-input";
import FilterSelect from "@/components/ui/filter-select";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import { fetchPaginated, parsePageParam } from "@/lib/fetch-paginated";
import {
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_OPTIONS,
  colorOf,
  labelOf,
} from "@/lib/labels";

const ITEMS_PER_PAGE = 10;

function EquipmentStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={labelOf(EQUIPMENT_STATUS_LABELS, status)}
      colorClass={colorOf(
        EQUIPMENT_STATUS_COLORS,
        status,
        "bg-surface-sunken text-text",
      )}
    />
  );
}

function LastTransaction({
  tx,
}: {
  tx: EquipmentListItem["last_transaction"];
}) {
  if (!tx) return <span className="text-text">-</span>;
  return (
    <div>
      <span
        className={tx.type === "check_out" ? "text-danger" : "text-success"}
      >
        {tx.type_display}
      </span>
      <span className="text-text ml-2">by {tx.handler_name}</span>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EquipmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const search = (params.search as string) || "";
  const statusFilter = (params.status as string) || "";
  const categoryFilter = (params.category as string) || "";
  const page = parsePageParam(params.page as string | undefined);

  const data = await fetchPaginated<EquipmentListItem>("/v1/equipments/", {
    token,
    page,
    pageSize: ITEMS_PER_PAGE,
    query: {
      search: search || undefined,
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    },
  });
  const equipments = data.results;
  const totalItems = data.count;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const hasFilters = search || statusFilter || categoryFilter;
  const emptyMessage = hasFilters
    ? "검색 결과가 없습니다"
    : "등록된 장비가 없습니다";

  const columns: Column<EquipmentListItem>[] = [
    {
      key: "name",
      header: "장비명",
      render: (equipment) => (
        <Link
          href={`/equipments/${equipment.id}`}
          className="text-accent hover:underline font-medium"
        >
          {equipment.name}
        </Link>
      ),
    },
    {
      key: "serial_number",
      header: "시리얼번호",
      className: "text-text font-mono text-sm",
      render: (equipment) => equipment.serial_number,
    },
    {
      key: "category",
      header: "분류",
      className: "text-text",
      render: (equipment) =>
        labelOf(EQUIPMENT_CATEGORY_LABELS, equipment.category),
    },
    {
      key: "contract",
      header: "사업",
      className: "text-text",
      render: (equipment) => (
        <Link
          href={`/contracts/${equipment.contract}`}
          className="hover:underline"
        >
          {equipment.contract_name}
        </Link>
      ),
    },
    {
      key: "status",
      header: "상태",
      render: (equipment) => <EquipmentStatusBadge status={equipment.status} />,
    },
    {
      key: "last_transaction",
      header: "최근 이력",
      className: "text-text text-sm",
      render: (equipment) => (
        <LastTransaction tx={equipment.last_transaction} />
      ),
    },
  ];

  const renderMobileCard = (equipment: EquipmentListItem) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Link
            href={`/equipments/${equipment.id}`}
            className="font-medium text-accent block"
          >
            {equipment.name}
          </Link>
          <div className="text-sm text-text font-mono">
            {equipment.serial_number}
          </div>
        </div>
        <EquipmentStatusBadge status={equipment.status} />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text">분류</span>
          <span className="text-text">
            {labelOf(EQUIPMENT_CATEGORY_LABELS, equipment.category)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">사업</span>
          <Link
            href={`/contracts/${equipment.contract}`}
            className="text-text underline"
          >
            {equipment.contract_name}
          </Link>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">최근 이력</span>
          <div className="text-right">
            <LastTransaction tx={equipment.last_transaction} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">장비 반출입 관리</h1>
        <Link
          href="/equipments/new"
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          장비 등록
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Suspense fallback={<div className="h-10 bg-surface-sunken rounded-md animate-pulse" />}>
            <SearchInput placeholder="장비명, 시리얼번호, 사업명 검색..." />
          </Suspense>
        </div>
        <div className="flex gap-2">
          <Suspense fallback={<div className="h-10 w-28 bg-surface-sunken rounded-md animate-pulse" />}>
            <FilterSelect
              options={EQUIPMENT_STATUS_OPTIONS}
              paramName="status"
              placeholder="전체 상태"
            />
          </Suspense>
          <Suspense fallback={<div className="h-10 w-28 bg-surface-sunken rounded-md animate-pulse" />}>
            <FilterSelect
              options={EQUIPMENT_CATEGORY_OPTIONS}
              paramName="category"
              placeholder="전체 분류"
            />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton rows={5} columns={6} />}>
        <ResponsiveTable
          columns={columns}
          rows={equipments}
          rowKey={(equipment) => equipment.id}
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
