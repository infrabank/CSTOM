import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";

interface EngineerProfile {
  id: number;
  user_name: string;
  user_email: string;
  skills: string;
  specialization: string;
  availability_status: string;
  availability_status_display: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-success-bg text-success",
  busy: "bg-warning-bg text-warning",
  on_leave: "bg-surface-sunken text-text-muted",
  unavailable: "bg-danger-bg text-danger",
};

async function getEngineers(token?: string): Promise<EngineerProfile[]> {
  try {
    const res = await fetch(`${API_URL}/v1/workforce/engineers/`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export default async function WorkforcePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  
  const engineers = await getEngineers(token);

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">인력 관리</h1>
        <Link
          href="/workforce/schedule"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          일정 관리
        </Link>
      </div>

      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                전문분야
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                기술스택
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                상태
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {engineers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  등록된 엔지니어가 없습니다
                </td>
              </tr>
            ) : (
              engineers.map((engineer) => (
                <tr key={engineer.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/workforce/${engineer.id}`}
                      className="text-accent hover:underline font-medium text-sm"
                    >
                      {engineer.user_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {engineer.user_email}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {engineer.specialization || "-"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {engineer.skills || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[engineer.availability_status] || "bg-surface-sunken text-text-muted"}`}>
                      {engineer.availability_status_display}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {engineers.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 엔지니어가 없습니다
          </div>
        ) : (
          engineers.map((engineer) => (
            <div key={engineer.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <Link
                href={`/workforce/${engineer.id}`}
                className="font-medium text-accent block hover:underline text-sm"
              >
                {engineer.user_name}
              </Link>

              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[engineer.availability_status] || "bg-surface-sunken text-text-muted"}`}>
                  {engineer.availability_status_display}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-border-light pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">이메일</span>
                  <span className="text-text-muted">{engineer.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">전문분야</span>
                  <span className="text-text-muted">{engineer.specialization || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">기술스택</span>
                  <span className="text-text-muted">{engineer.skills || "-"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
