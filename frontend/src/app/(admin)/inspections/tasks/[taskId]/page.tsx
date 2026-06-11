"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import {
  inspectionsClient,
  type InspectionTaskDetail as InspectionTask,
  type InspectionScheduleOption as InspectionSchedule,
  type InspectionUser as User,
} from "../../api";
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  optionsFromLabels,
  labelOf,
  colorOf,
} from "@/lib/labels";

const STATUS_OPTIONS = optionsFromLabels(INSPECTION_STATUS_LABELS);

// Inspection result labels are local to this page (not part of @/lib/labels).
const RESULT_LABELS: Record<string, string> = {
  normal: "정상",
  abnormal: "이상",
  action_required: "조치필요",
};

export default function InspectionTaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<InspectionTask | null>(null);
  const [schedules, setSchedules] = useState<InspectionSchedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");

  // Edit form state
  const [scheduleId, setScheduleId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  // Completion form state
  const [submitting, setSubmitting] = useState(false);
  const [completionFormData, setCompletionFormData] = useState({
    result: "normal" as "normal" | "abnormal" | "action_required",
    notes: "",
  });

  const getUserDisplayName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.last_name}${user.first_name} (${user.username})`;
    }
    return user.username;
  };

  // Fetch task and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task details
        let taskData: InspectionTask;
        try {
          taskData = await inspectionsClient.getTask(taskId);
        } catch {
          setError("점검 작업을 찾을 수 없습니다");
          setIsLoading(false);
          return;
        }
        setTask(taskData);

        // Set form values
        setScheduleId(String(taskData.schedule));
        setScheduledDate(taskData.scheduled_date);
        setAssignedTo(taskData.assigned_to ? String(taskData.assigned_to) : "");
        setStatus(taskData.status);
        setNotes(taskData.notes || "");

        // Fetch active schedules and users for edit mode
        const [schedulesData, usersData] = await Promise.all([
          inspectionsClient.listActiveSchedules(),
          inspectionsClient.listUsers(),
        ]);
        setSchedules(
          Array.isArray(schedulesData) ? schedulesData : schedulesData.results || [],
        );
        setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("데이터를 불러올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const updatedData = await inspectionsClient.updateTask(taskId, {
        schedule: parseInt(scheduleId),
        scheduled_date: scheduledDate,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
        status,
        notes,
      });
      setTask(updatedData);
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
      await inspectionsClient.deleteTask(taskId);
      router.push("/inspections/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const cancelEdit = () => {
    if (task) {
      setScheduleId(String(task.schedule));
      setScheduledDate(task.scheduled_date);
      setAssignedTo(task.assigned_to ? String(task.assigned_to) : "");
      setStatus(task.status);
      setNotes(task.notes || "");
    }
    setIsEditing(false);
    setError("");
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setSubmitting(true);
      await inspectionsClient.completeTask(task.id, completionFormData);
      router.push("/inspections/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text-muted">로딩 중...</div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/inspections/tasks"
            className="text-accent hover:underline text-sm"
          >
            점검 작업 목록으로
          </Link>
        </div>
        <div className="bg-danger-bg text-danger p-4 rounded-md">{error}</div>
      </div>
    );
  }

  if (!task) return null;

  const isEditable = task.status === "pending" || task.status === "in_progress";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/inspections/tasks"
          className="text-accent hover:underline text-sm"
        >
          점검 작업 목록으로
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error}
        </div>
      )}

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-4xl">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">점검 작업 상세</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-danger text-text-on-accent rounded-md hover:bg-danger/90 disabled:opacity-50"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !scheduleId || !scheduledDate}
                  className="px-4 py-2 bg-success text-text-on-accent rounded-md hover:bg-success/90 disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
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
              <label className="block text-sm font-medium text-text mb-1">
                스케줄 *
              </label>
              <select
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">스케줄 선택</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.equipment_type} - {schedule.contract_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                예정일 *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                담당자
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                상태 *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                비고
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  장비 유형
                </div>
                <div className="text-lg font-semibold">
                  {task.schedule_equipment}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  예정일
                </div>
                <div>
                  {new Date(task.scheduled_date).toLocaleDateString("ko-KR")}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  담당자
                </div>
                <div>{task.assigned_to_name || "-"}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  상태
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium ${colorOf(
                    INSPECTION_STATUS_COLORS,
                    task.status,
                  )}`}
                >
                  {labelOf(INSPECTION_STATUS_LABELS, task.status)}
                </span>
              </div>

              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  등록일
                </div>
                <div>
                  {new Date(task.created_at).toLocaleDateString("ko-KR")}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  수정일
                </div>
                <div>
                  {new Date(task.updated_at).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </div>

            {task.notes && (
              <div>
                <div className="text-sm font-medium text-text-muted mb-1">
                  비고
                </div>
                <div className="text-text-secondary whitespace-pre-wrap">
                  {task.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inspection Results Section */}
      <div className="bg-surface shadow-card rounded-lg p-6 max-w-4xl mt-6">
        <h2 className="text-lg font-semibold mb-4">점검 결과</h2>

        {isEditable ? (
          // Completion Form
          <form onSubmit={handleCompletionSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                점검 결과
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="normal"
                    checked={completionFormData.result === "normal"}
                    onChange={(e) =>
                      setCompletionFormData({
                        ...completionFormData,
                        result: e.target.value as typeof completionFormData.result,
                      })
                    }
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-text">정상</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="abnormal"
                    checked={completionFormData.result === "abnormal"}
                    onChange={(e) =>
                      setCompletionFormData({
                        ...completionFormData,
                        result: e.target.value as typeof completionFormData.result,
                      })
                    }
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-text">이상</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="action_required"
                    checked={completionFormData.result === "action_required"}
                    onChange={(e) =>
                      setCompletionFormData({
                        ...completionFormData,
                        result: e.target.value as typeof completionFormData.result,
                      })
                    }
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-text">조치필요</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                비고
              </label>
              <textarea
                value={completionFormData.notes}
                onChange={(e) =>
                  setCompletionFormData({
                    ...completionFormData,
                    notes: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="추가 사항을 입력하세요"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent text-white py-2 px-4 rounded-lg font-medium hover:bg-accent-hover disabled:bg-surface-sunken disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/inspections/tasks")}
                className="flex-1 bg-surface-sunken text-text py-2 px-4 rounded-lg font-medium hover:bg-border-light transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          // Results Display
          <div>
            {task.results && task.results.length > 0 ? (
              <div className="space-y-4">
                {task.results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-surface-sunken p-4 rounded-lg"
                  >
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm font-medium text-text-muted mb-1">
                          점검 결과
                        </div>
                        <div className="text-text">
                          {RESULT_LABELS[result.result] || result.result}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-muted mb-1">
                          완료자
                        </div>
                        <div className="text-text">
                          {result.completed_by_name}
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-sm font-medium text-text-muted mb-1">
                        완료일시
                      </div>
                      <div className="text-text">
                        {new Date(result.completed_at).toLocaleString("ko-KR")}
                      </div>
                    </div>
                    {result.notes && (
                      <div>
                        <div className="text-sm font-medium text-text-muted mb-1">
                          비고
                        </div>
                        <div className="text-text whitespace-pre-wrap">
                          {result.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-4">
                점검 결과가 없습니다
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="점검 작업 삭제"
        message="이 점검 작업을 삭제하시겠습니까?"
        confirmText="삭제"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
