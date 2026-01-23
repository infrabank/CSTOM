import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

interface UsersResponse {
  results: User[];
}

async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_URL}/users/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    const data: UsersResponse = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

const STATUS_LABELS: Record<string, string> = {
  active: "활성",
  inactive: "비활성",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-black",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  pm: "PM",
  engineer: "엔지니어",
  customer: "고객",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  pm: "bg-blue-100 text-blue-800",
  engineer: "bg-purple-100 text-purple-800",
  customer: "bg-yellow-100 text-yellow-800",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-black";
  const label = STATUS_LABELS[status] || status;
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

function RoleBadges({ roles }: { roles: Role[] }) {
  if (roles.length === 0) {
    return <span className="text-black text-sm">역할 없음</span>;
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {roles.map((role) => (
        <span
          key={role.id}
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            ROLE_COLORS[role.name] || "bg-gray-100 text-black"
          }`}
        >
          {ROLE_LABELS[role.name] || role.name.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          사용자 등록
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                아이디
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                등록일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  등록된 사용자가 없습니다
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {user.username}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black">
                    {user.display_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black">{user.email}</td>
                  <td className="px-6 py-4">
                    <RoleBadges roles={user.roles} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {new Date(user.created_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
