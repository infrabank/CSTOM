"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";
import ConfirmModal from "@/components/confirm-modal";

interface Contract {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface InspectionSchedule {
  id: number;
  equipment_type: string;
  contract: number;
  contract_name: string;
  cycle: string;
  assigned_to: number | null;
  assigned_to_name: string;
  description: string;
  is_active: boolean;
  task_count: number;
  created_at: string;
  updated_at: string;
}

interface InspectionTask {
  id: number;
  schedule: number;
  scheduled_date: string;
  status: string;
  notes: string;
  completed_at: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const CYCLE_OPTIONS = [
  { value: "monthly", label: "월간" },
  { value: "quarterly", label: "분기" },
  { value: "biannual", label: "반기" },
  { value: "annual", label: "연간" },
];

const CYCLE_LABELS: Record<string, string> = {
  monthly: "월간",
  quarterly: "분기",
  biannual: "반기",
  annual: "연간",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default function InspectionScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [schedule, setSchedule] = useState<InspectionSchedule | null>(null);
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [contractId, setContractId] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [cycle, setCycle] = useState("monthly");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const getToken = () => {
    return getAccessToken();
  };

  // Fetch schedule and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        // Fetch schedule details
        const scheduleRes = await fetch(
          `${API_URL}/v1/inspections/schedules/${id}/`,
          { headers }
        );

        if (!scheduleRes.ok) {
          if (scheduleRes.status === 404) {
            setError("점검 스케줄을 찾을 수 없습니다");
          } else {
            setError("데이터를 불러올 수 없습니다");
          }
          setIsLoading(false);
          return;
        }

        const scheduleData = await scheduleRes.json();
        setSchedule(scheduleData);

        // Set form values
        setContractId(String(scheduleData.contract));
        setEquipmentType(scheduleData.equipment_type);
        setCycle(scheduleData.cycle);
        setAssignedTo(scheduleData.assigned_to ? String(scheduleData.assigned_to) : "");
        setDescription(scheduleData.description || "");
        setIsActive(scheduleData.is_active);

        // Fetch related tasks
        const tasksRes = await fetch(
          `${API_URL}/v1/inspections/tasks/?schedule=${id}`,
          { headers }
        );
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData.results || tasksData || []);
        }

        // Fetch contracts for edit mode
        const contractsRes = await fetch(`${API_URL}/v1/contracts/`, { headers });
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || contractsData || []);
        }

        // Fetch users for edit mode
        const usersRes = await fetch(`${API_URL}/v1/users/`, { headers });
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
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const token = getToken();
      if (!token) {
        setError("인증 토큰이 없습니다. 다시 로그인해주세요.");
        setIsSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/v1/inspections/schedules/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contract: parseInt(contractId),
          equipment_type: equipmentType,
          cycle,
          assigned_to: assignedTo ? parseInt(assignedTo) : null,
          description,
          is_active: isActive,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        const errMsg =
          errData.detail ||
          Object.values(errData).flat().join(", ") ||
          "저장에 실패했습니다";
        throw new Error(errMsg);
      }

      const updatedData = await res.json();
      setSchedule(updatedData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = getToken();
      if (!token) {
        setError("인증 토큰이 없습니다");
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        return;
      }

      const res = await fetch(`${API_URL}/v1/inspections/schedules/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("삭제에 실패했습니다");
      }

      router.push("/inspections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelEdit = () => {
    if (schedule) {
      setContractId(String(schedule.contract));
      setEquipmentType(schedule.equipment_type);
      setCycle(schedule.cycle);
      setAssignedTo(schedule.assigned_to ? String(schedule.assigned_to) : "");
      setDescription(schedule.description || "");
      setIsActive(schedule.is_active);
    }
    setIsEditing(false);
    setError("");
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.last_name}${user.first_name} (${user.username})`;
    }
    return user.username;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error && !schedule) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/inspections" className="text-blue-600 hover:underline text-sm">
            점검 스케줄 목록으로
          </Link>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/inspections" className="text-blue-600 hover:underline text-sm">
          점검 스케줄 목록으로
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-4xl">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">점검 스케줄 상세</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !contractId || !equipmentType}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          // Edit Form
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                사업 *
              </label>
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">사업 선택</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                장비 유형 *
              </label>
              <input
                type="text"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                점검 주기 *
              </label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                담당자
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">담당자 선택</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-1">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-black">
                활성화
              </label>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">장비 유형</div>
                <div className="text-lg font-semibold">{schedule.equipment_type}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">사업</div>
                <Link
                  href={`/contracts/${schedule.contract}`}
                  className="text-blue-600 hover:underline"
                >
                  {schedule.contract_name}
                </Link>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">점검 주기</div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {CYCLE_LABELS[schedule.cycle] || schedule.cycle}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">담당자</div>
                <div>{schedule.assigned_to_name || "-"}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">활성 상태</div>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    schedule.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {schedule.is_active ? "활성" : "비활성"}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">생성된 작업 수</div>
                <div className="text-lg font-semibold">{schedule.task_count}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">등록일</div>
                <div>{new Date(schedule.created_at).toLocaleDateString("ko-KR")}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">수정일</div>
                <div>{new Date(schedule.updated_at).toLocaleDateString("ko-KR")}</div>
              </div>
            </div>

            {schedule.description && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">설명</div>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {schedule.description}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Inspection Tasks */}
      <div className="bg-white shadow-sm rounded-lg p-6 max-w-4xl mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">점검 작업 목록</h2>
          <Link
            href={`/inspections/tasks?schedule=${id}`}
            className="text-blue-600 text-sm hover:underline"
          >
            전체 보기
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            생성된 점검 작업이 없습니다
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-black">
                    예정일
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-black">
                    상태
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-black">
                    완료일
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-black">
                    비고
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.slice(0, 10).map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link
                        href={`/inspections/tasks/${task.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {new Date(task.scheduled_date).toLocaleDateString("ko-KR")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[task.status] || "bg-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {task.completed_at
                        ? new Date(task.completed_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-xs">
                      {task.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length > 10 && (
              <div className="text-center py-2 text-sm text-gray-500">
                외 {tasks.length - 10}건 더 있음
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="점검 스케줄 삭제"
        message="이 점검 스케줄을 삭제하시겠습니까?"
        confirmText="삭제"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
