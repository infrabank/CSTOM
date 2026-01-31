"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";

interface InspectionTask {
  id: number;
  schedule: number;
  equipment_type: string;
  contract_name: string;
  scheduled_date: string;
  assigned_to_name: string;
  status: "pending" | "in_progress" | "completed";
  result_count: number;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default function InspectionTasksPage() {
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<InspectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = getAccessToken();

        const res = await fetch(`${API_URL}/v1/inspections/tasks/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error("점검 작업을 불러올 수 없습니다");
        }

        const data = await res.json();
        setTasks(data.results || []);
        setFilteredTasks(data.results || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "점검 작업을 불러올 수 없습니다"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "all") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === filter));
    }
  };

  const filterTabs = [
    { label: "전체", value: "all", count: tasks.length },
    {
      label: "대기",
      value: "pending",
      count: tasks.filter((t) => t.status === "pending").length,
    },
    {
      label: "진행중",
      value: "in_progress",
      count: tasks.filter((t) => t.status === "in_progress").length,
    },
    {
      label: "완료",
      value: "completed",
      count: tasks.filter((t) => t.status === "completed").length,
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">점검 작업</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeFilter === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    장비 유형
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    사업
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    예정일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    결과
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-black">
                      {error
                        ? "점검 작업을 불러올 수 없습니다"
                        : "등록된 점검 작업이 없습니다"}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/inspections/tasks/${task.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {task.equipment_type}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-black text-sm">
                        {task.contract_name}
                      </td>
                      <td className="px-6 py-4 text-black text-sm">
                        {new Date(task.scheduled_date).toLocaleDateString(
                          "ko-KR"
                        )}
                      </td>
                      <td className="px-6 py-4 text-black text-sm">
                        {task.assigned_to_name}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-6 py-4 text-black text-sm text-center">
                        {task.result_count}
                      </td>
                      <td className="px-6 py-4 text-black text-sm">
                        {new Date(task.created_at).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
                {error
                  ? "점검 작업을 불러올 수 없습니다"
                  : "등록된 점검 작업이 없습니다"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-lg shadow-sm p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Link
                        href={`/inspections/tasks/${task.id}`}
                        className="font-medium text-blue-600 block"
                      >
                        {task.equipment_type}
                      </Link>
                      <div className="text-sm text-black">
                        {task.contract_name}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-black">예정일</span>
                      <span className="text-black">
                        {new Date(task.scheduled_date).toLocaleDateString(
                          "ko-KR"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-black">담당자</span>
                      <span className="text-black">{task.assigned_to_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-black">결과</span>
                      <span className="text-black">{task.result_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-black">등록일</span>
                      <span className="text-black">
                        {new Date(task.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
