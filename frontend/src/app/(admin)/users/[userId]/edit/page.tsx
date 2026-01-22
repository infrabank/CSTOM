"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateUser } from "../../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  status: string;
  is_active: boolean;
}

const STATUS_OPTIONS = [
  { value: "active", label: "활성" },
  { value: "inactive", label: "비활성" },
];

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function EditUserPage({ params }: PageProps) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${API_URL}/users/${userId}/`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("사용자 정보를 불러오지 못했습니다");
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사용자 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateUser(parseInt(userId, 10), formData);

    if (result.success) {
      router.push(`/users/${userId}`);
    } else {
      setError(result.error || "사용자 수정에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">불러오는 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error || "사용자를 찾을 수 없습니다"}
        </div>
        <Link href="/users" className="text-blue-600 hover:underline">
          사용자 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/users/${userId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          사용자 상세로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사용자 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사용자명 *
            </label>
            <input
              type="text"
              name="username"
              required
              defaultValue={user.username}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 *
            </label>
            <input
              type="email"
              name="email"
              required
              defaultValue={user.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              표시 이름
            </label>
            <input
              type="text"
              name="display_name"
              defaultValue={user.display_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              placeholder="변경시에만 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              비밀번호를 변경하려면 입력하세요. 비워두면 기존 비밀번호가 유지됩니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상태
            </label>
            <select
              name="status"
              defaultValue={user.status}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={user.is_active}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">계정 활성화</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
            <Link
              href={`/users/${userId}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
