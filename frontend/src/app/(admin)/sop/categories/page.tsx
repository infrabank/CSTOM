"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";
import ConfirmModal from "@/components/confirm-modal";

interface SOPCategory {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function SOPCategoriesPage() {
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParent, setFormParent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const getHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/sop/categories/`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.results || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, [getHeaders]);

  useEffect(() => {
    async function init() {
      await fetchCategories();
      setIsLoading(false);
    }
    init();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다");
      }

      const res = await fetch(`${API_URL}/v1/sop/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          description: formDescription || "",
          parent: formParent ? parseInt(formParent) : null,
        }),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errData = await res.json();
          const errMsg =
            errData.detail ||
            errData.name?.[0] ||
            Object.values(errData).flat().join(", ") ||
            "등록에 실패했습니다";
          throw new Error(errMsg);
        }
        throw new Error(`등록에 실패했습니다 (HTTP ${res.status})`);
      }

      setFormName("");
      setFormDescription("");
      setFormParent("");
      setShowForm(false);
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/v1/sop/categories/${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok || res.status === 204) {
        await fetchCategories();
      } else {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errData = await res.json();
          setError(errData.detail || "삭제에 실패했습니다");
        } else {
          setError(`삭제에 실패했습니다 (HTTP ${res.status})`);
        }
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
      setError("삭제에 실패했습니다");
    }
  };

  const getCategoryName = (parentId: number | null): string => {
    if (!parentId) return "-";
    const parent = categories.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/sop" className="text-accent hover:underline text-sm">
            SOP 목록으로
          </Link>
          <h1 className="text-2xl font-semibold text-text mt-1">SOP 카테고리 관리</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          {showForm ? "닫기" : "카테고리 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-surface shadow-card rounded-lg p-6 mb-6 border border-border-light">
          <h2 className="text-lg font-semibold mb-4">카테고리 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-name" className="block text-sm font-medium text-text-secondary mb-1">
                  이름 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="form-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="예: 장애대응, 보안, 백업/복구"
                />
              </div>

              <div>
                <label htmlFor="form-parent" className="block text-sm font-medium text-text-secondary mb-1">
                  상위 카테고리
                </label>
                <select
                  id="form-parent"
                  value={formParent}
                  onChange={(e) => setFormParent(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">없음 (최상위)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="form-desc" className="block text-sm font-medium text-text-secondary mb-1">
                설명
              </label>
              <input
                type="text"
                id="form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="카테고리 설명 (선택)"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !formName.trim()}
                className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? "등록 중..." : "등록"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                설명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                상위 카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                  등록된 카테고리가 없습니다
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-text">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {cat.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {getCategoryName(cat.parent)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                      className="text-danger hover:underline text-sm"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {categories.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 카테고리가 없습니다
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="font-medium text-text text-sm">{cat.name}</span>
                <button
                  onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}
                  className="text-danger hover:underline text-xs"
                >
                  삭제
                </button>
              </div>
              {cat.description && (
                <p className="text-sm text-text-secondary">{cat.description}</p>
              )}
              {cat.parent && (
                <div className="text-xs text-text-muted">
                  상위: {getCategoryName(cat.parent)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="카테고리 삭제"
        message={deleteTarget ? `"${deleteTarget.name}" 카테고리를 삭제하시겠습니까?` : ""}
        confirmText="삭제"
        isDestructive
      />
    </div>
  );
}
