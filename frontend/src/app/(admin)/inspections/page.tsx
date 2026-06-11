import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  INSPECTION_CYCLE_LABELS,
  INSPECTION_CYCLE_COLORS,
  labelOf,
  colorOf,
} from "@/lib/labels";

interface InspectionSchedule {
  id: number;
  equipment_type: string;
  contract: number;
  contract_name: string;
  cycle: string;
  assigned_to: number;
  assigned_to_name: string;
  is_active: boolean;
  task_count: number;
  created_at: string;
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge
      label={isActive ? "활성" : "비활성"}
      colorClass={
        isActive
          ? "bg-success-bg text-success"
          : "bg-surface-sunken text-text-muted"
      }
    />
  );
}

function CycleBadge({ cycle }: { cycle: string }) {
  return (
    <StatusBadge
      label={labelOf(INSPECTION_CYCLE_LABELS, cycle)}
      colorClass={colorOf(INSPECTION_CYCLE_COLORS, cycle)}
    />
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InspectionsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<InspectionSchedule>(
    "/v1/inspections/schedules/",
    { token, page },
  );
  const inspections = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const columns: Column<InspectionSchedule>[] = [
    {
      key: "equipment_type",
      header: "장비 유형",
      render: (item) => (
        <Link
          href={`/inspections/${item.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {item.equipment_type}
        </Link>
      ),
    },
    {
      key: "contract_name",
      header: "사업",
      className: "text-text-secondary text-sm",
      render: (item) => (
        <Link href={`/contracts/${item.contract}`} className="hover:underline">
          {item.contract_name}
        </Link>
      ),
    },
    {
      key: "cycle",
      header: "주기",
      render: (item) => <CycleBadge cycle={item.cycle} />,
    },
    {
      key: "assigned_to_name",
      header: "담당자",
      className: "text-text-secondary text-sm",
      render: (item) => item.assigned_to_name,
    },
    {
      key: "is_active",
      header: "활성 상태",
      render: (item) => <ActiveBadge isActive={item.is_active} />,
    },
    {
      key: "task_count",
      header: "작업 수",
      className: "text-text-secondary text-sm text-center",
      render: (item) => item.task_count,
    },
    {
      key: "created_at",
      header: "등록일",
      className: "text-text-secondary text-sm",
      render: (item) => new Date(item.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (item: InspectionSchedule) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Link
            href={`/inspections/${item.id}`}
            className="font-medium text-accent block text-sm"
          >
            {item.equipment_type}
          </Link>
          <div className="text-sm text-text-muted">
            <Link
              href={`/contracts/${item.contract}`}
              className="hover:underline"
            >
              {item.contract_name}
            </Link>
          </div>
        </div>
        <ActiveBadge isActive={item.is_active} />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">주기</span>
          <CycleBadge cycle={item.cycle} />
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">담당자</span>
          <span className="text-text-muted">{item.assigned_to_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">작업 수</span>
          <span className="text-text-muted">{item.task_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">등록일</span>
          <span className="text-text-muted">
            {new Date(item.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">점검 스케줄 관리</h1>
        <Link
          href="/inspections/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          점검 스케줄 등록
        </Link>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={inspections}
        rowKey={(item) => item.id}
        emptyMessage="등록된 점검 스케줄이 없습니다"
        renderMobileCard={renderMobileCard}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
