/**
 * Server-side helper for SOP category mutations used by the server actions in
 * this directory. Mirrors the explicit-token raw-fetch pattern of
 * reports/actions.ts (server actions pass the cookie token directly; no
 * client 401-refresh applies on the server).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface SOPCategoryCreateInput {
  name: string;
  description: string;
  parent: number | null;
}

function authHeaders(token?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function extractError(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    return (
      data?.detail ||
      data?.name?.[0] ||
      (data && typeof data === "object"
        ? Object.values(data).flat().join(", ")
        : "") ||
      fallback
    );
  }
  return `${fallback} (HTTP ${res.status})`;
}

export const sopCategoriesApi = {
  async create(data: SOPCategoryCreateInput, token?: string) {
    const res = await fetch(`${API_URL}/v1/sop/categories/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await extractError(res, "등록에 실패했습니다"));
    return res.json();
  },
  async remove(id: number, token?: string) {
    const res = await fetch(`${API_URL}/v1/sop/categories/${id}/`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(await extractError(res, "삭제에 실패했습니다"));
    }
  },
};
