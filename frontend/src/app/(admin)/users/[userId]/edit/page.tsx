"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateUser } from "../../actions";
import { usersClient, type UserEditData as User } from "../../api";
import { USER_STATUS_LABELS, optionsFromLabels } from "@/lib/labels";

const STATUS_OPTIONS = optionsFromLabels(USER_STATUS_LABELS);

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
        const data = await usersClient.get(userId);
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
        <div className="text-center text-text">불러오는 중...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error || "사용자를 찾을 수 없습니다"}
        </div>
         <Link href="/users" className="text-accent hover:underline">
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
           className="text-accent hover:underline text-sm"
         >
          사용자 상세로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사용자 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-text mb-1">
               사용자명 *
             </label>
             <input
               type="text"
               name="username"
               required
               defaultValue={user.username}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               이메일 *
             </label>
             <input
               type="email"
               name="email"
               required
               defaultValue={user.email}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               표시 이름
             </label>
             <input
               type="text"
               name="display_name"
               defaultValue={user.display_name}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               비밀번호
             </label>
             <input
               type="password"
               name="password"
               placeholder="변경시에만 입력"
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
             <p className="mt-1 text-xs text-text">
               비밀번호를 변경하려면 입력하세요. 비워두면 기존 비밀번호가 유지됩니다.
             </p>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               상태
             </label>
             <select
               name="status"
               defaultValue={user.status}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
                 className="rounded border-border text-accent focus:ring-accent"
               />
               <span className="text-sm">계정 활성화</span>
             </label>
           </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
             <Link
               href={`/users/${userId}`}
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
