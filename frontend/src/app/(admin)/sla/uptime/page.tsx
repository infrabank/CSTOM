import { cookies } from "next/headers";
import { Suspense } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import type { ContractListItem, EquipmentListItem, UptimeRecord } from "@/lib/api";
import { EQUIPMENT_CATEGORY_LABELS, labelOf } from "@/lib/labels";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import { UptimeFormIsland, UptimeDeleteButton } from "./uptime-client";

function formatPercent(value: string | null): string {
  if (!value) return "-";
  return Number(value).toFixed(2) + "%";
}

function uptimeColor(value: string | null): string {
  if (!value) return "text-text-muted";
  const n = Number(value);
  if (n >= 99.5) return "text-success";
  if (n >= 99.0) return "text-warning";
  return "text-danger";
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UptimePage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, summaryPage, equipmentsPage, contractsPage] = await Promise.all([
    fetchPaginated<UptimeRecord>("/v1/sla/uptime-records/", { token, page }),
    // Large page used only to compute the category-average summary cards.
    fetchPaginated<UptimeRecord>("/v1/sla/uptime-records/", {
      token,
      page: 1,
      pageSize: 200,
    }),
    fetchPaginated<EquipmentListItem>("/v1/equipments/", {
      token,
      page: 1,
      pageSize: 200,
    }),
    fetchPaginated<ContractListItem>("/v1/contracts/", {
      token,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const records = data.results;
  const contracts = contractsPage.results;
  const equipments = equipmentsPage.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  // Group by category for summary (computed across all records).
  const categoryMap: Record<string, { total: number; count: number }> = {};
  summaryPage.results.forEach((r) => {
    const cat = r.equipment_category || "other";
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    if (r.uptime_percentage) {
      categoryMap[cat].total += Number(r.uptime_percentage);
      categoryMap[cat].count += 1;
    }
  });

  const columns: Column<UptimeRecord>[] = [
    {
      key: "equipment_name",
      header: "장비",
      className: "text-text text-sm",
      render: (r) => r.equipment_name,
    },
    {
      key: "category",
      header: "분류",
      className: "text-text-muted text-sm",
      render: (r) => labelOf(EQUIPMENT_CATEGORY_LABELS, r.equipment_category),
    },
    {
      key: "period",
      header: "기간",
      className: "text-text-muted text-sm",
      render: (r) => `${r.period_start} ~ ${r.period_end}`,
    },
    {
      key: "total_operating_hours",
      header: "운영시간",
      className: "text-text text-sm text-right",
      render: (r) => `${r.total_operating_hours}h`,
    },
    {
      key: "unplanned_downtime_hours",
      header: "중단시간",
      className: "text-text text-sm text-right",
      render: (r) => `${r.unplanned_downtime_hours}h`,
    },
    {
      key: "uptime",
      header: "가동율",
      className: "text-right",
      render: (r) => (
        <span className={`text-sm font-medium ${uptimeColor(r.uptime_percentage)}`}>
          {formatPercent(r.uptime_percentage)}
        </span>
      ),
    },
    {
      key: "downtime_reason",
      header: "사유",
      className: "text-text-secondary text-sm",
      render: (r) => r.downtime_reason || "-",
    },
    {
      key: "actions",
      header: "삭제",
      className: "text-center",
      render: (r) => <UptimeDeleteButton id={r.id} />,
    },
  ];

  const renderMobileCard = (r: UptimeRecord) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-2 border border-border-light">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium text-text text-sm">{r.equipment_name}</span>
          <span className="ml-2 text-xs text-text-muted">
            {labelOf(EQUIPMENT_CATEGORY_LABELS, r.equipment_category)}
          </span>
        </div>
        <span className={`text-sm font-semibold ${uptimeColor(r.uptime_percentage)}`}>
          {formatPercent(r.uptime_percentage)}
        </span>
      </div>
      <div className="text-xs text-text-muted">
        {r.period_start} ~ {r.period_end}
      </div>
      <div className="flex justify-between text-xs">
        <span>
          운영 {r.total_operating_hours}h / 중단 {r.unplanned_downtime_hours}h
        </span>
        <UptimeDeleteButton id={r.id} compact />
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />
      <UptimeFormIsland contracts={contracts} equipments={equipments} />

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {Object.entries(categoryMap).map(([cat, summary]) => {
          const avg =
            summary.count > 0 ? (summary.total / summary.count).toFixed(2) : "-";
          return (
            <div
              key={cat}
              className="bg-surface shadow-card rounded-lg p-3 border border-border-light text-center"
            >
              <div className="text-xs text-text-muted">
                {labelOf(EQUIPMENT_CATEGORY_LABELS, cat)}
              </div>
              <div
                className={`text-lg font-semibold mt-1 ${uptimeColor(
                  summary.count > 0 ? String(summary.total / summary.count) : null,
                )}`}
              >
                {avg}
                {summary.count > 0 ? "%" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <Suspense fallback={<TableSkeleton rows={5} columns={8} />}>
        <ResponsiveTable
          columns={columns}
          rows={records}
          rowKey={(r) => r.id}
          emptyMessage="등록된 가동율 기록이 없습니다"
          renderMobileCard={renderMobileCard}
        />
      </Suspense>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
