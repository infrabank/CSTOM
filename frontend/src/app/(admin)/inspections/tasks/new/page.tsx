"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";

interface InspectionSchedule {
  id: number;
  equipment_type: string;
  contract_name: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "대기" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
];

export default function NewInspectionTaskPage() {
  const router = useRouter();
  const [scheduleId, setScheduleId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const [schedules, setSchedules] = useState<InspectionSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch schedules and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAccessToken();

        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        // Fetch active schedules
        const schedulesRes = await fetch(`${API_URL}/v1/inspections/schedules/?is_active=true`, {
          headers,
        });
        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setSchedules(schedulesData.results || schedulesData || []);
        }

        // Fetch users
        const usersRes = await fetch(`${API_URL}/v1/users/`, {
          headers,
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.results || usersData || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("데이터를 불러올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();

      if (!token) {
        setError("인증 토큰이 없습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`${API_URL}/v1/inspections/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schedule: parseInt(scheduleId),
          scheduled_date: scheduledDate,
          assigned_to: parseInt(assignedTo),
          status,
          notes,
        }),
      });

      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const errData = await res.json();
          const errMsg =
            errData.detail ||
            Object.values(errData).flat().join(", ") ||
            "등록에 실패했습니다";
          throw new Error(errMsg);
        }
        throw new Error(`등록에 실패했습니다 (HTTP ${res.status})`);
      }

      router.push("/inspections/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.last_name}${user.first_name} (${user.username})`;
    }
    return user.username;
  };

  const getScheduleDisplayName = (schedule: InspectionSchedule) => {
    return `${schedule.equipment_type} - ${schedule.contract_name}`;
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
       <div className="mb-6">
         <Link href="/inspections/tasks" className="text-accent hover:underline text-sm">
           점검 작업 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">점검 작업 등록</h1>

         {error && (
           <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
             {error}
           </div>
         )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Schedule */}
          <div>
             <label
               htmlFor="schedule"
               className="block text-sm font-medium text-text mb-1"
             >
               점검 스케줄 *
             </label>
             <select
               id="schedule"
               value={scheduleId}
               onChange={(e) => setScheduleId(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              <option value="">스케줄 선택</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {getScheduleDisplayName(schedule)}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
             <label
               htmlFor="scheduledDate"
               className="block text-sm font-medium text-text mb-1"
             >
               점검 예정일 *
             </label>
             <input
               id="scheduledDate"
               type="date"
               value={scheduledDate}
               onChange={(e) => setScheduledDate(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
          </div>

          {/* Assigned To */}
          <div>
             <label
               htmlFor="assignedTo"
               className="block text-sm font-medium text-text mb-1"
             >
               담당자 *
             </label>
             <select
               id="assignedTo"
               value={assignedTo}
               onChange={(e) => setAssignedTo(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              <option value="">담당자 선택</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
             <label
               htmlFor="status"
               className="block text-sm font-medium text-text mb-1"
             >
               상태 *
             </label>
             <select
               id="status"
               value={status}
               onChange={(e) => setStatus(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
             <label
               htmlFor="notes"
               className="block text-sm font-medium text-text mb-1"
             >
               비고
             </label>
             <textarea
               id="notes"
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               rows={4}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="점검 작업에 대한 비고를 입력하세요"
             />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !scheduleId || !scheduledDate || !assignedTo}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
             <Link
               href="/inspections/tasks"
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-text-secondary"
             >
               취소
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
