"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import { getAccessToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  pm: "PM",
  engineer: "엔지니어",
  customer: "고객",
};

interface Role {
  id: number;
  name: string;
  description: string;
}

interface UserActionsProps {
  userId: number;
  userName: string;
  currentRoleIds: number[];
}

export default function UserActions({
  userId,
  userName,
  currentRoleIds,
}: UserActionsProps) {
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(currentRoleIds);

  useEffect(() => {
    if (showRoleModal) {
      fetchRoles();
      setSelectedRoleIds(currentRoleIds);
    }
  }, [showRoleModal, currentRoleIds]);

  async function fetchRoles() {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/roles/`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAllRoles(data.results || data);
      }
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    }
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRoleIds.length === 0) {
      setError("최소 1개 이상의 역할을 선택해야 합니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/users/${userId}/roles/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ role_ids: selectedRoleIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.error || "역할 변경에 실패했습니다");
      }

      setShowRoleModal(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "역할 변경에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/users/${userId}/`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "삭제에 실패했습니다");
      }

      router.push("/users");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }

  return (
    <>
      <button
        onClick={() => setShowRoleModal(true)}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        역할 관리
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50"
      >
        삭제
      </button>

      {/* Role Management Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => !isSubmitting && setShowRoleModal(false)}
        title="역할 관리"
      >
        <form onSubmit={handleRoleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              역할 선택
            </label>
            <div className="space-y-2">
              {allRoles.map((role) => (
                <label
                  key={role.id}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedRoleIds.includes(role.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="mr-3"
                  />
                  <div>
                    <span className="text-black font-medium">
                      {ROLE_LABELS[role.name] || role.name}
                    </span>
                    {role.description && (
                      <p className="text-sm text-gray-500">{role.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedRoleIds.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isSubmitting && setShowDeleteModal(false)}
        title="사용자 삭제"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <p className="text-black">
            정말로 <span className="font-semibold">{userName}</span> 사용자를
            삭제하시겠습니까?
          </p>
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
            이 작업은 되돌릴 수 없습니다.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
