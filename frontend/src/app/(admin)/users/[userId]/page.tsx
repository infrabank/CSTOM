import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import UserActions from "../user-actions";

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
  is_active: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

async function getUser(id: number, token?: string): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/v1/users/${id}/`, {
      cache: "no-store",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const id = parseInt(userId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  const user = await getUser(id, token);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/users" className="text-blue-600 hover:underline text-sm">
          사용자 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{user.display_name || user.username}</h1>
            <p className="text-black">@{user.username}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[user.status] || "bg-gray-100 text-black"
            }`}
          >
            {STATUS_LABELS[user.status] || user.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-black mb-1">이메일</h3>
            <p>{user.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">등록일</h3>
            <p>{new Date(user.created_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">최종 수정일</h3>
            <p>{new Date(user.updated_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">활성 여부</h3>
            <p>{user.is_active ? "예" : "아니오"}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-black mb-2">역할</h3>
          {!user.roles || user.roles.length === 0 ? (
            <p className="text-black">역할이 할당되지 않았습니다</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ROLE_COLORS[role.name] || "bg-gray-100 text-black"
                  }`}
                >
                  {ROLE_LABELS[role.name] || role.name.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/users/${user.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            수정
          </Link>
          <UserActions
            userId={user.id}
            userName={user.display_name || user.username}
            currentRoleIds={user.roles?.map((r) => r.id) || []}
          />
        </div>
      </div>
    </div>
  );
}
