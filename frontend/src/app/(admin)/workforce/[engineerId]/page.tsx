import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/breadcrumb";

interface EngineerProfile {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  skills: string;
  specialization: string;
  availability_status: string;
  availability_status_display: string;
  created_at: string;
  updated_at: string;
}

interface Schedule {
  id: number;
  date: string;
  schedule_type: string;
  schedule_type_display: string;
  notes: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-success-bg text-success",
  busy: "bg-warning-bg text-warning",
  on_leave: "bg-surface-sunken text-text-muted",
  unavailable: "bg-danger-bg text-danger",
};

const TYPE_COLORS: Record<string, string> = {
  work: "bg-info-bg text-accent",
  vacation: "bg-success-bg text-success",
  training: "bg-warning-bg text-warning",
  sick_leave: "bg-danger-bg text-danger",
  other: "bg-surface-sunken text-text-muted",
};

export default async function EngineerDetailPage({
  params,
}: {
  params: Promise<{ engineerId: string }>;
}) {
  const { engineerId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Fetch engineer profile
  let engineer: EngineerProfile | null = null;
  try {
    const res = await fetch(`${API_URL}/v1/workforce/engineers/${engineerId}/`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      notFound();
    }
    engineer = await res.json();
  } catch {
    notFound();
  }

  if (!engineer) {
    notFound();
  }

  // Fetch recent schedules for this engineer
  let schedules: Schedule[] = [];
  try {
    const res = await fetch(
      `${API_URL}/v1/workforce/schedules/?engineer=${engineer.user}`,
      { headers, cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      schedules = (data.results || data || []).slice(0, 20);
    }
  } catch {
    // silently fail
  }

  return (
    <div>
      <Breadcrumb />

      <div className="mb-6">
        <Link href="/workforce" className="text-accent hover:underline text-sm">
          인력 관리로
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-surface shadow-card rounded-lg p-6 border border-border-light mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-text">{engineer.user_name}</h1>
            <p className="text-text-secondary text-sm mt-1">{engineer.user_email}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              STATUS_COLORS[engineer.availability_status] || "bg-surface-sunken text-text-muted"
            }`}
          >
            {engineer.availability_status_display}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-border-light pt-6">
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              전문분야
            </h3>
            <p className="text-text text-sm">{engineer.specialization || "-"}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              기술스택
            </h3>
            <p className="text-text text-sm">{engineer.skills || "-"}</p>
          </div>
        </div>
      </div>

      {/* Recent Schedules */}
      <div className="bg-surface shadow-card rounded-lg border border-border-light">
        <div className="px-6 py-4 border-b border-border-light flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text">최근 일정</h2>
          <Link
            href="/workforce/schedule"
            className="text-accent hover:underline text-sm"
          >
            전체 일정 관리
          </Link>
        </div>

        {schedules.length === 0 ? (
          <div className="px-6 py-8 text-center text-text-muted">
            등록된 일정이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text font-medium w-28">{schedule.date}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      TYPE_COLORS[schedule.schedule_type] || "bg-surface-sunken text-text-muted"
                    }`}
                  >
                    {schedule.schedule_type_display}
                  </span>
                </div>
                <span className="text-sm text-text-secondary">{schedule.notes || ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
