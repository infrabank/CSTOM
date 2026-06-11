"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/confirm-modal";
import {
  inspectionsClient,
  type InspectionContract as Contract,
  type InspectionUser as User,
  type InspectionScheduleDetail as InspectionSchedule,
  type InspectionTaskRow as InspectionTask,
} from "../api";
import {
  INSPECTION_CYCLE_LABELS,
  INSPECTION_CYCLE_COLORS,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  optionsFromLabels,
  labelOf,
  colorOf,
} from "@/lib/labels";

const CYCLE_OPTIONS = optionsFromLabels(INSPECTION_CYCLE_LABELS);

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

  // Fetch schedule and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch schedule details
        let scheduleData: InspectionSchedule;
        try {
          scheduleData = await inspectionsClient.getSchedule(id);
        } catch {
          setError("점검 스케줄을 찾을 수 없습니다");
          setIsLoading(false);
          return;
        }
        setSchedule(scheduleData);

        // Set form values
        setContractId(String(scheduleData.contract));
        setEquipmentType(scheduleData.equipment_type);
        setCycle(scheduleData.cycle);
        setAssignedTo(scheduleData.assigned_to ? String(scheduleData.assigned_to) : "");
        setDescription(scheduleData.description || "");
        setIsActive(scheduleData.is_active);

        // Fetch related tasks, contracts, and users for edit mode
        const [tasksData, contractsData, usersData] = await Promise.all([
          inspectionsClient.listTasksBySchedule(id),
          inspectionsClient.listContracts(),
          inspectionsClient.listUsers(),
        ]);
        setTasks(Array.isArray(tasksData) ? tasksData : tasksData.results || []);
        setContracts(
          Array.isArray(contractsData) ? contractsData : contractsData.results || [],
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
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const updatedData = await inspectionsClient.updateSchedule(id, {
        contract: parseInt(contractId),
        equipment_type: equipmentType,
        cycle,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
        description,
        is_active: isActive,
      });
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
      await inspectionsClient.deleteSchedule(id);
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
         <div className="text-center text-text-muted">로딩 중...</div>
       </div>
     );
   }

   if (error && !schedule) {
     return (
       <div className="p-6">
         <div className="mb-6">
           <Link href="/inspections" className="text-accent hover:underline text-sm">
             점검 스케줄 목록으로
           </Link>
         </div>
         <div className="bg-danger-bg text-danger p-4 rounded-md">{error}</div>
       </div>
     );
   }

   if (!schedule) return null;

   return (
     <div className="p-6">
       <div className="mb-6">
         <Link href="/inspections" className="text-accent hover:underline text-sm">
           점검 스케줄 목록으로
         </Link>
       </div>

       {error && (
         <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">{error}</div>
       )}

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-4xl">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">점검 스케줄 상세</h1>
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
                  disabled={isSaving || !contractId || !equipmentType}
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
                 사업 *
               </label>
               <select
                 value={contractId}
                 onChange={(e) => setContractId(e.target.value)}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
               <label className="block text-sm font-medium text-text mb-1">
                 장비 유형 *
               </label>
               <input
                 type="text"
                 value={equipmentType}
                 onChange={(e) => setEquipmentType(e.target.value)}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 점검 주기 *
               </label>
               <select
                 value={cycle}
                 onChange={(e) => setCycle(e.target.value)}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               >
                {CYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
                 설명
               </label>
               <textarea
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 rows={4}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>

             <div className="flex items-center gap-2">
               <input
                 id="isActive"
                 type="checkbox"
                 checked={isActive}
                 onChange={(e) => setIsActive(e.target.checked)}
                 className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
               />
               <label htmlFor="isActive" className="text-sm text-text">
                 활성화
               </label>
             </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">장비 유형</div>
                 <div className="text-lg font-semibold">{schedule.equipment_type}</div>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">사업</div>
                 <Link
                   href={`/contracts/${schedule.contract}`}
                   className="text-accent hover:underline"
                 >
                   {schedule.contract_name}
                 </Link>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">점검 주기</div>
                 <span className={`px-2 py-1 rounded-full text-sm ${colorOf(INSPECTION_CYCLE_COLORS, schedule.cycle)}`}>
                   {labelOf(INSPECTION_CYCLE_LABELS, schedule.cycle)}
                 </span>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">담당자</div>
                 <div>{schedule.assigned_to_name || "-"}</div>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">활성 상태</div>
                 <span
                   className={`px-2 py-1 rounded-full text-sm ${
                     schedule.is_active
                       ? "bg-success-bg text-success"
                       : "bg-surface-sunken text-text-muted"
                   }`}
                 >
                   {schedule.is_active ? "활성" : "비활성"}
                 </span>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">생성된 작업 수</div>
                 <div className="text-lg font-semibold">{schedule.task_count}</div>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">등록일</div>
                 <div>{new Date(schedule.created_at).toLocaleDateString("ko-KR")}</div>
               </div>

               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">수정일</div>
                 <div>{new Date(schedule.updated_at).toLocaleDateString("ko-KR")}</div>
               </div>
             </div>

             {schedule.description && (
               <div>
                 <div className="text-sm font-medium text-text-muted mb-1">설명</div>
                 <div className="text-text-secondary whitespace-pre-wrap">
                   {schedule.description}
                 </div>
               </div>
             )}
          </div>
        )}
      </div>

       {/* Related Inspection Tasks */}
       <div className="bg-surface shadow-card rounded-lg p-6 max-w-4xl mt-6">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-semibold">점검 작업 목록</h2>
           <Link
             href={`/inspections/tasks?schedule=${id}`}
             className="text-accent text-sm hover:underline"
           >
             전체 보기
           </Link>
         </div>

         {tasks.length === 0 ? (
           <p className="text-text-muted text-center py-4">
             생성된 점검 작업이 없습니다
           </p>
         ) : (
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-border-light">
               <thead className="bg-surface-sunken">
                 <tr>
                   <th className="px-4 py-2 text-left text-sm font-medium text-text">
                     예정일
                   </th>
                   <th className="px-4 py-2 text-left text-sm font-medium text-text">
                     상태
                   </th>
                   <th className="px-4 py-2 text-left text-sm font-medium text-text">
                     완료일
                   </th>
                   <th className="px-4 py-2 text-left text-sm font-medium text-text">
                     비고
                   </th>
                 </tr>
               </thead>
               <tbody className="bg-surface divide-y divide-border-light">
                 {tasks.slice(0, 10).map((task) => (
                   <tr key={task.id} className="hover:bg-surface-sunken">
                     <td className="px-4 py-2">
                       <Link
                         href={`/inspections/tasks/${task.id}`}
                         className="text-accent hover:underline"
                       >
                         {new Date(task.scheduled_date).toLocaleDateString("ko-KR")}
                       </Link>
                     </td>
                     <td className="px-4 py-2">
                       <span
                         className={`px-2 py-1 rounded-full text-xs font-medium ${colorOf(
                           INSPECTION_STATUS_COLORS,
                           task.status,
                         )}`}
                       >
                         {labelOf(INSPECTION_STATUS_LABELS, task.status)}
                       </span>
                     </td>
                     <td className="px-4 py-2 text-sm text-text-muted">
                       {task.completed_at
                         ? new Date(task.completed_at).toLocaleDateString("ko-KR")
                         : "-"}
                     </td>
                     <td className="px-4 py-2 text-sm text-text-muted truncate max-w-xs">
                       {task.notes || "-"}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {tasks.length > 10 && (
               <div className="text-center py-2 text-sm text-text-muted">
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
