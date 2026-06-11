/**
 * Server-side helper for workforce schedule mutations used by the server
 * actions in this directory. Mirrors the explicit-token raw-fetch pattern of
 * reports/actions.ts.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ScheduleCreateInput {
  engineer: number;
  date: string;
  schedule_type: string;
  notes: string | null;
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
      (data && typeof data === "object"
        ? Object.values(data).flat().join(", ")
        : "") ||
      fallback
    );
  }
  return `${fallback} (HTTP ${res.status})`;
}

export const workforceSchedulesApi = {
  async create(data: ScheduleCreateInput, token?: string) {
    const res = await fetch(`${API_URL}/v1/workforce/schedules/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await extractError(res, "일정 등록에 실패했습니다"));
    }
    return res.json();
  },
  async remove(id: number, token?: string) {
    const res = await fetch(`${API_URL}/v1/workforce/schedules/${id}/`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(await extractError(res, "삭제에 실패했습니다"));
    }
  },
};
