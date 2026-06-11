import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import UserActions from "../user-actions";
import Breadcrumb from "@/components/ui/breadcrumb";
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
  is_active: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

async function getUser(id: number, token?: string): Promise<User | null> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const res = await fetch(`${apiUrl}/v1/users/${id}/`, {
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
    <div>
      <Breadcrumb />
      <div className="mb-6">
        <Link href="/users" className="text-accent hover:underline text-sm">
          사용자 목록으로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text">{user.display_name || user.username}</h1>
            <p className="text-text">@{user.username}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${colorOf(
              USER_STATUS_COLORS,
              user.status,
              "bg-surface-sunken text-text",
            )}`}
          >
            {labelOf(USER_STATUS_LABELS, user.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-text mb-1">이메일</h3>
            <p>{user.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text mb-1">등록일</h3>
            <p>{new Date(user.created_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text mb-1">최종 수정일</h3>
            <p>{new Date(user.updated_at).toLocaleString("ko-KR")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text mb-1">활성 여부</h3>
            <p>{user.is_active ? "예" : "아니오"}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-text mb-2">역할</h3>
          {!user.roles || user.roles.length === 0 ? (
            <p className="text-text">역할이 할당되지 않았습니다</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {user.roles.map((role) => (
                <span
                  key={role.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${colorOf(
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
          )}
        </div>

        <div className="flex gap-3">
          <Link
            href={`/users/${user.id}/edit`}
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
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
