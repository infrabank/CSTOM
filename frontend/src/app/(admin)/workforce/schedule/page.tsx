import { cookies } from "next/headers";
import { Suspense } from "react";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  ScheduleControls,
  ScheduleDeleteButton,
} from "./schedule-client";

interface Engineer {
  id: number;
  user: number;
  user_name: string;
}

interface Schedule {
  id: number;
  engineer: number;
  engineer_name: string;
  date: string;
  schedule_type: string;
  schedule_type_display: string;
  notes: string | null;
  created_at: string;
}

// Schedule-type colors are local to this page (not part of @/lib/labels).
const TYPE_COLORS: Record<string, string> = {
  work: "bg-info-bg text-accent",
  vacation: "bg-success-bg text-success",
  training: "bg-warning-bg text-warning",
  sick_leave: "bg-danger-bg text-danger",
  other: "bg-surface-sunken text-text-muted",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    engineer?: string;
    date_from?: string;
    date_to?: string;
  }>;
}

export default async function WorkforceSchedulePage({
  searchParams,
}: PageProps) {
  const {
    page: pageRaw,
    engineer = "",
    date_from = "",
    date_to = "",
  } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, engineersPage] = await Promise.all([
    fetchPaginated<Schedule>("/v1/workforce/schedules/", {
      token,
      page,
      query: {
        engineer: engineer || undefined,
        date_from: date_from || undefined,
        date_to: date_to || undefined,
      },
    }),
    fetchPaginated<Engineer>("/v1/workforce/engineers/", {
      token,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const schedules = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));
  const engineers = engineersPage.results;

  const columns: Column<Schedule>[] = [
    {
      key: "engineer_name",
      header: "엔지니어",
      className: "text-text font-medium text-sm",
      render: (s) => s.engineer_name,
    },
    {
      key: "date",
      header: "날짜",
      className: "text-text text-sm",
      render: (s) => s.date,
    },
    {
      key: "schedule_type",
      header: "유형",
      render: (s) => (
        <StatusBadge
          label={s.schedule_type_display}
          colorClass={
            TYPE_COLORS[s.schedule_type] || "bg-surface-sunken text-text-muted"
          }
        />
      ),
    },
    {
      key: "notes",
      header: "비고",
      className: "text-text-secondary text-sm",
      render: (s) => s.notes || "-",
    },
    {
      key: "actions",
      header: "작업",
      render: (s) => <ScheduleDeleteButton id={s.id} />,
    },
  ];

  const renderMobileCard = (s: Schedule) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-text text-sm">{s.engineer_name}</div>
          <div className="text-xs text-text-muted mt-1">{s.date}</div>
        </div>
        <StatusBadge
          label={s.schedule_type_display}
          colorClass={
            TYPE_COLORS[s.schedule_type] || "bg-surface-sunken text-text-muted"
          }
        />
      </div>
      {s.notes && (
        <div className="text-sm text-text-secondary border-t border-border-light pt-2">
          {s.notes}
        </div>
      )}
      <div className="flex justify-end">
        <ScheduleDeleteButton id={s.id} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <ScheduleControls
        engineers={engineers}
        filterEngineer={engineer}
        filterDateFrom={date_from}
        filterDateTo={date_to}
      />

      <Suspense fallback={<TableSkeleton rows={5} columns={5} />}>
        <ResponsiveTable
          columns={columns}
          rows={schedules}
          rowKey={(s) => s.id}
          emptyMessage="등록된 일정이 없습니다"
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
