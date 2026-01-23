"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser, getRoles } from "../actions";

interface Role {
  id: number;
  name: string;
  description: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  pm: "PM",
  engineer: "엔지니어",
  customer: "고객",
};

export default function NewUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchRoles() {
      const rolesData = await getRoles();
      setRoles(rolesData);
    }
    fetchRoles();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createUser(formData);

    if (result.success) {
      router.push(`/users/${result.id}`);
    } else {
      setError(result.error || "사용자 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/users" className="text-blue-600 hover:underline text-sm">
          사용자 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사용자 등록</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              아이디 *
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              이메일 *
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비밀번호 *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-black">최소 8자 이상</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              이름
            </label>
            <input
              type="text"
              name="display_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              역할
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="role_ids"
                    value={role.id}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{ROLE_LABELS[role.name] || role.name}</span>
                  {role.description && (
                    <span className="text-xs text-black">
                      - {role.description}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
            <Link
              href="/users"
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
