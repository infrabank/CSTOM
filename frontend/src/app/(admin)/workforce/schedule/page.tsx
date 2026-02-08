"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";

interface Engineer {
  id: number;
  user: number;
  user_name: string;
}

interface Schedule {
  id: number;
  engineer: number;
  engineer_name: string;
  date: string;
  schedule_type: string;
  schedule_type_display: string;
  notes: string | null;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const SCHEDULE_TYPES = [
  { value: "work", label: "근무" },
  { value: "vacation", label: "휴가" },
  { value: "training", label: "교육" },
  { value: "sick_leave", label: "병가" },
  { value: "other", label: "기타" },
];

const TYPE_COLORS: Record<string, string> = {
  work: "bg-info-bg text-accent",
  vacation: "bg-success-bg text-success",
  training: "bg-warning-bg text-warning",
  sick_leave: "bg-danger-bg text-danger",
  other: "bg-surface-sunken text-text-muted",
};

export default function WorkforceSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterEngineer, setFilterEngineer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [formEngineer, setFormEngineer] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("work");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }, []);

  const fetchSchedules = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEngineer) params.set("engineer", filterEngineer);
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_URL}/v1/workforce/schedules/${query}`, {
        headers: getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setSchedules(data.results || data || []);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    }
  }, [filterEngineer, filterDateFrom, filterDateTo, getHeaders]);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = getHeaders();

        const engineersRes = await fetch(`${API_URL}/v1/workforce/engineers/`, { headers });
        if (engineersRes.ok) {
          const data = await engineersRes.json();
          setEngineers(data.results || data || []);
        }

        await fetchSchedules();
      } catch (err) {
        setError("데이터를 불러오는데 실패했습니다");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [getHeaders, fetchSchedules]);

  useEffect(() => {
    if (!isLoading) {
      fetchSchedules();
    }
  }, [filterEngineer, filterDateFrom, filterDateTo, fetchSchedules, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다");
      }

      const res = await fetch(`${API_URL}/v1/workforce/schedules/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          engineer: parseInt(formEngineer),
          date: formDate,
          schedule_type: formType,
          notes: formNotes || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "일정 등록에 실패했습니다");
      }

      // Reset form and refresh
      setFormEngineer("");
      setFormDate("");
      setFormType("work");
      setFormNotes("");
      setShowForm(false);
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 등록에 실패했습니다");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/v1/workforce/schedules/${id}/`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok || res.status === 204) {
        await fetchSchedules();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/workforce" className="text-accent hover:underline text-sm">
            인력 관리로
          </Link>
          <h1 className="text-2xl font-semibold text-text mt-1">일정 관리</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
        >
          {showForm ? "닫기" : "일정 등록"}
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
          <h2 className="text-lg font-semibold mb-4">일정 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-engineer" className="block text-sm font-medium text-text-secondary mb-1">
                  엔지니어 <span className="text-danger">*</span>
                </label>
                <select
                  id="form-engineer"
                  value={formEngineer}
                  onChange={(e) => setFormEngineer(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">선택하세요</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.user}>
                      {eng.user_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="form-date" className="block text-sm font-medium text-text-secondary mb-1">
                  날짜 <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  id="form-date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label htmlFor="form-type" className="block text-sm font-medium text-text-secondary mb-1">
                  유형 <span className="text-danger">*</span>
                </label>
                <select
                  id="form-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {SCHEDULE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="form-notes" className="block text-sm font-medium text-text-secondary mb-1">
                  비고
                </label>
                <input
                  type="text"
                  id="form-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="메모 입력"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
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

      {/* Filters */}
      <div className="bg-surface shadow-card rounded-lg p-4 mb-6 border border-border-light">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filter-engineer" className="block text-xs font-medium text-text-muted mb-1">
              엔지니어
            </label>
            <select
              id="filter-engineer"
              value={filterEngineer}
              onChange={(e) => setFilterEngineer(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            >
              <option value="">전체</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.user}>
                  {eng.user_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-from" className="block text-xs font-medium text-text-muted mb-1">
              시작일
            </label>
            <input
              type="date"
              id="filter-from"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
          <div>
            <label htmlFor="filter-to" className="block text-xs font-medium text-text-muted mb-1">
              종료일
            </label>
            <input
              type="date"
              id="filter-to"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                엔지니어
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                날짜
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                비고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  등록된 일정이 없습니다
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-text">
                    {schedule.engineer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-text">
                    {schedule.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[schedule.schedule_type] || "bg-surface-sunken text-text-muted"}`}>
                      {schedule.schedule_type_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {schedule.notes || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(schedule.id)}
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
        {schedules.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 일정이 없습니다
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-text text-sm">{schedule.engineer_name}</div>
                  <div className="text-xs text-text-muted mt-1">{schedule.date}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[schedule.schedule_type] || "bg-surface-sunken text-text-muted"}`}>
                  {schedule.schedule_type_display}
                </span>
              </div>
              {schedule.notes && (
                <div className="text-sm text-text-secondary border-t border-border-light pt-2">
                  {schedule.notes}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="text-danger hover:underline text-xs"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
