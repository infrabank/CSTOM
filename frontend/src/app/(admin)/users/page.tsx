import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

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

const STATUS_LABELS: Record<string, string> = {
  active: "활성",
  inactive: "비활성",
};

const STATUS_COLORS: Record<string, string> = {
   active: "bg-success-bg text-success",
   inactive: "bg-surface-sunken text-text",
 };

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  pm: "PM",
  engineer: "엔지니어",
  customer: "고객",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-danger-bg text-danger",
  pm: "bg-info-bg text-info",
  engineer: "bg-info-bg text-info",
  customer: "bg-warning-bg text-warning",
};

function StatusBadge({ status }: { status: string }) {
   const colorClass = STATUS_COLORS[status] || "bg-surface-sunken text-text";
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
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
           className={`px-2 py-0.5 rounded text-xs font-medium ${
             ROLE_COLORS[role.name] || "bg-surface-sunken text-text"
           }`}
        >
          {ROLE_LABELS[role.name] || role.name.toUpperCase()}
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

       <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden">
         <table className="min-w-full divide-y divide-border-light">
           <thead className="bg-surface-sunken">
             <tr>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 아이디
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 이름
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 이메일
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 역할
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 상태
               </th>
               <th className="px-6 py-3 text-left text-sm font-medium text-text uppercase">
                 등록일
               </th>
             </tr>
           </thead>
           <tbody className="bg-surface divide-y divide-border-light">
             {users.length === 0 ? (
               <tr>
                 <td colSpan={6} className="px-6 py-4 text-center text-text">
                   등록된 사용자가 없습니다
                 </td>
               </tr>
            ) : (
               users.map((user) => (
                 <tr key={user.id} className="hover:bg-surface-sunken">
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${user.id}`}
                       className="text-accent hover:underline font-medium"
                    >
                      {user.username}
                    </Link>
                  </td>
                   <td className="px-6 py-4 text-text">
                     {user.display_name || "-"}
                   </td>
                   <td className="px-6 py-4 text-text">{user.email}</td>
                  <td className="px-6 py-4">
                    <RoleBadges roles={user.roles} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                   <td className="px-6 py-4 text-text text-sm">
                     {new Date(user.created_at).toLocaleDateString("ko-KR")}
                   </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

       {/* Mobile Card View */}
       <div className="md:hidden space-y-4">
         {users.length === 0 ? (
           <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text">
             등록된 사용자가 없습니다
           </div>
        ) : (
           users.map((user) => (
             <div key={user.id} className="bg-surface rounded-lg shadow-card p-4 space-y-3">
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
                <StatusBadge status={user.status} />
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
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
