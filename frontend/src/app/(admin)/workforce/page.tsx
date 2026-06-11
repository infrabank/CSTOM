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

interface EngineerProfile {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  skills: string[];
  specializations: string[];
  skills_display: string;
  specialization_display: string;
  availability_status: string;
  availability_status_display: string;
}

// Availability-status colors are local to this page (not part of @/lib/labels).
const STATUS_COLORS: Record<string, string> = {
  available: "bg-success-bg text-success",
  busy: "bg-warning-bg text-warning",
  on_leave: "bg-surface-sunken text-text-muted",
  unavailable: "bg-danger-bg text-danger",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function WorkforcePage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<EngineerProfile>(
    "/v1/workforce/engineers/",
    { token, page },
  );
  const engineers = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const statusColor = (status: string) =>
    STATUS_COLORS[status] || "bg-surface-sunken text-text-muted";

  const columns: Column<EngineerProfile>[] = [
    {
      key: "user_name",
      header: "이름",
      render: (engineer) => (
        <Link
          href={`/workforce/${engineer.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {engineer.user_name}
        </Link>
      ),
    },
    {
      key: "user_email",
      header: "이메일",
      className: "text-text-secondary text-sm",
      render: (engineer) => engineer.user_email,
    },
    {
      key: "specialization_display",
      header: "전문분야",
      className: "text-text-secondary text-sm",
      render: (engineer) => engineer.specialization_display || "-",
    },
    {
      key: "skills_display",
      header: "기술스택",
      className: "text-text-secondary text-sm",
      render: (engineer) => engineer.skills_display || "-",
    },
    {
      key: "availability_status",
      header: "상태",
      render: (engineer) => (
        <StatusBadge
          label={engineer.availability_status_display}
          colorClass={statusColor(engineer.availability_status)}
        />
      ),
    },
  ];

  const renderMobileCard = (engineer: EngineerProfile) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <Link
        href={`/workforce/${engineer.id}`}
        className="font-medium text-accent block hover:underline text-sm"
      >
        {engineer.user_name}
      </Link>

      <div className="flex gap-2">
        <StatusBadge
          label={engineer.availability_status_display}
          colorClass={statusColor(engineer.availability_status)}
        />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">이메일</span>
          <span className="text-text-muted">{engineer.user_email}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">전문분야</span>
          <span className="text-text-muted">
            {engineer.specialization_display || "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">기술스택</span>
          <span className="text-text-muted">
            {engineer.skills_display || "-"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">인력 관리</h1>
        <div className="flex gap-3">
          <Link
            href="/workforce/new"
            className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
          >
            엔지니어 등록
          </Link>
          <Link
            href="/workforce/schedule"
            className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors cursor-pointer text-sm font-medium"
          >
            일정 관리
          </Link>
        </div>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={engineers}
        rowKey={(engineer) => engineer.id}
        emptyMessage="등록된 엔지니어가 없습니다"
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
