'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/auth';

interface TaskDetail {
  id: number;
  schedule: number;
  equipment_type: string;
  contract_name: string;
  scheduled_date: string;
  assigned_to_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
  results: Array<{
    result: 'normal' | 'abnormal' | 'action_required';
    notes: string;
  }>;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function InspectionTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    result: 'normal' as 'normal' | 'abnormal' | 'action_required',
    notes: '',
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        const response = await fetch(`${API_URL}/v1/inspections/tasks/${taskId}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error('작업을 불러올 수 없습니다');
        }
        const data = await response.json();
        setTask(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setSubmitting(true);
      const token = getAccessToken();
      const response = await fetch(`${API_URL}/v1/inspections/tasks/${task.id}/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('점검 결과를 저장할 수 없습니다');
      }

      router.push('/inspections/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

   if (loading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-text-muted">로딩 중...</div>
       </div>
     );
   }

   if (error) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-danger">{error}</div>
       </div>
     );
   }

   if (!task) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <div className="text-text-muted">작업을 찾을 수 없습니다</div>
       </div>
     );
   }

  const isEditable = task.status === 'pending' || task.status === 'in_progress';
  const statusLabel = {
    pending: '대기 중',
    in_progress: '진행 중',
    completed: '완료',
  }[task.status];

   return (
     <div className="min-h-screen bg-surface-sunken py-8 px-4 sm:px-6 lg:px-8">
       <div className="max-w-2xl mx-auto">
         <div className="bg-surface rounded-lg shadow-card">
           {/* Header */}
           <div className="border-b border-border-light px-6 py-4">
             <h1 className="text-2xl font-bold text-text">점검 작업 상세</h1>
           </div>

          {/* Task Details */}
          <div className="px-6 py-6 space-y-6">
             {/* Status Badge */}
             <div className="flex items-center gap-4">
               <span className="text-text-muted font-medium">상태:</span>
               <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === 'completed'
                      ? 'bg-success-bg text-success'
                      : task.status === 'in_progress'
                        ? 'bg-info-bg text-info'
                        : 'bg-warning-bg text-warning'
                  }`}
               >
                 {statusLabel}
               </span>
             </div>

             {/* Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-text-secondary mb-1">
                   장비 유형
                 </label>
                 <p className="text-text">{task.equipment_type}</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-text-secondary mb-1">
                   계약명
                 </label>
                 <p className="text-text">{task.contract_name}</p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-text-secondary mb-1">
                   예정 날짜
                 </label>
                 <p className="text-text">
                   {new Date(task.scheduled_date).toLocaleDateString('ko-KR')}
                 </p>
               </div>

               <div>
                 <label className="block text-sm font-medium text-text-secondary mb-1">
                   담당자
                 </label>
                 <p className="text-text">{task.assigned_to_name}</p>
               </div>
             </div>

             {/* Description */}
             <div>
               <label className="block text-sm font-medium text-text-secondary mb-1">
                 설명
               </label>
               <p className="text-text">{task.description}</p>
             </div>

             {/* Divider */}
             <hr className="border-border-light" />

             {/* Result Form or Display */}
             {isEditable ? (
               <form onSubmit={handleSubmit} className="space-y-6">
                 <h2 className="text-lg font-semibold text-text">점검 결과</h2>

                 {/* Result Radio Group */}
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
                         checked={formData.result === 'normal'}
                         onChange={(e) =>
                           setFormData({ ...formData, result: e.target.value as typeof formData.result })
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
                         checked={formData.result === 'abnormal'}
                         onChange={(e) =>
                           setFormData({ ...formData, result: e.target.value as typeof formData.result })
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
                         checked={formData.result === 'action_required'}
                         onChange={(e) =>
                           setFormData({ ...formData, result: e.target.value as typeof formData.result })
                         }
                         className="w-4 h-4 text-accent"
                       />
                       <span className="text-text">조치필요</span>
                     </label>
                   </div>
                 </div>

                 {/* Notes Textarea */}
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     비고
                   </label>
                   <textarea
                     value={formData.notes}
                     onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                     rows={4}
                     className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                     placeholder="추가 사항을 입력하세요"
                   />
                 </div>

                 {/* Buttons */}
                 <div className="flex gap-3 pt-4">
                   <button
                     type="submit"
                     disabled={submitting}
                     className="flex-1 bg-accent text-white py-2 px-4 rounded-lg font-medium hover:bg-accent-hover disabled:bg-surface-sunken disabled:cursor-not-allowed transition-colors"
                   >
                     {submitting ? '저장 중...' : '저장'}
                   </button>
                   <button
                     type="button"
                     onClick={() => router.push('/inspections/tasks')}
                     className="flex-1 bg-surface-sunken text-text py-2 px-4 rounded-lg font-medium hover:bg-border-light transition-colors"
                   >
                     취소
                   </button>
                 </div>
               </form>
             ) : (
               <div className="space-y-6">
                 <h2 className="text-lg font-semibold text-text">점검 결과</h2>

                 {task.results && task.results.length > 0 ? (
                   <div className="space-y-4">
                     {task.results.map((result, index) => (
                       <div key={index} className="bg-surface-sunken p-4 rounded-lg">
                         <div className="mb-3">
                           <label className="block text-sm font-medium text-text-secondary mb-1">
                             점검 결과
                           </label>
                           <p className="text-text">
                             {result.result === 'normal'
                               ? '정상'
                               : result.result === 'abnormal'
                                 ? '이상'
                                 : '조치필요'}
                           </p>
                         </div>
                         {result.notes && (
                           <div>
                             <label className="block text-sm font-medium text-text-secondary mb-1">
                               비고
                             </label>
                             <p className="text-text whitespace-pre-wrap">{result.notes}</p>
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <p className="text-text-muted">점검 결과가 없습니다</p>
                 )}

                 <button
                   onClick={() => router.push('/inspections/tasks')}
                   className="w-full bg-surface-sunken text-text py-2 px-4 rounded-lg font-medium hover:bg-border-light transition-colors"
                 >
                   목록으로 돌아가기
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
