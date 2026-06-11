import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
  labelOf,
  colorOf,
} from "@/lib/labels";

interface Role {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  status: string;
  roles: Role[];
  created_at: string;
}

function RoleBadges({ roles }: { roles?: Role[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-text text-sm">역할 없음</span>;
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {roles.map((role) => (
        <span
          key={role.id}
          className={`px-2 py-0.5 rounded text-xs font-medium ${colorOf(
            USER_ROLE_COLORS,
            role.name,
            "bg-surface-sunken text-text",
          )}`}
        >
          {labelOf(USER_ROLE_LABELS, role.name) === role.name
            ? role.name.toUpperCase()
            : labelOf(USER_ROLE_LABELS, role.name)}
        </span>
      ))}
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<User>("/v1/users/", { token, page });
  const users = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const columns: Column<User>[] = [
    {
      key: "username",
      header: "아이디",
      render: (user) => (
        <Link
          href={`/users/${user.id}`}
          className="text-accent hover:underline font-medium"
        >
          {user.username}
        </Link>
      ),
    },
    {
      key: "display_name",
      header: "이름",
      className: "text-text",
      render: (user) => user.display_name || "-",
    },
    {
      key: "email",
      header: "이메일",
      className: "text-text",
      render: (user) => user.email,
    },
    {
      key: "roles",
      header: "역할",
      render: (user) => <RoleBadges roles={user.roles} />,
    },
    {
      key: "status",
      header: "상태",
      render: (user) => (
        <StatusBadge
          label={labelOf(USER_STATUS_LABELS, user.status)}
          colorClass={colorOf(
            USER_STATUS_COLORS,
            user.status,
            "bg-surface-sunken text-text",
          )}
        />
      ),
    },
    {
      key: "created_at",
      header: "등록일",
      className: "text-text text-sm",
      render: (user) => new Date(user.created_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (user: User) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href={`/users/${user.id}`}
            className="font-medium text-accent block"
          >
            {user.username}
          </Link>
          <div className="text-sm text-text mt-1">{user.email}</div>
        </div>
        <StatusBadge
          label={labelOf(USER_STATUS_LABELS, user.status)}
          colorClass={colorOf(
            USER_STATUS_COLORS,
            user.status,
            "bg-surface-sunken text-text",
          )}
        />
      </div>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text">이름</span>
          <span className="text-text">{user.display_name || "-"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-text">역할</span>
          <RoleBadges roles={user.roles} />
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">등록일</span>
          <span className="text-text">
            {new Date(user.created_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          사용자 등록
        </Link>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={users}
        rowKey={(user) => user.id}
        emptyMessage="등록된 사용자가 없습니다"
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
