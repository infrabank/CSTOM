'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
        const response = await fetch(`/api/v1/inspections/tasks/${taskId}/`);
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
      const response = await fetch(`/api/v1/inspections/tasks/${task.id}/complete/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">작업을 찾을 수 없습니다</div>
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">점검 작업 상세</h1>
          </div>

          {/* Task Details */}
          <div className="px-6 py-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">상태:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  장비 유형
                </label>
                <p className="text-gray-900">{task.equipment_type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  계약명
                </label>
                <p className="text-gray-900">{task.contract_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예정 날짜
                </label>
                <p className="text-gray-900">
                  {new Date(task.scheduled_date).toLocaleDateString('ko-KR')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자
                </label>
                <p className="text-gray-900">{task.assigned_to_name}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <p className="text-gray-900">{task.description}</p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Result Form or Display */}
            {isEditable ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">점검 결과</h2>

                {/* Result Radio Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">정상</span>
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
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">이상</span>
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
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900">조치필요</span>
                    </label>
                  </div>
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비고
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="추가 사항을 입력하세요"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/inspections/tasks')}
                    className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">점검 결과</h2>

                {task.results && task.results.length > 0 ? (
                  <div className="space-y-4">
                    {task.results.map((result, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            점검 결과
                          </label>
                          <p className="text-gray-900">
                            {result.result === 'normal'
                              ? '정상'
                              : result.result === 'abnormal'
                                ? '이상'
                                : '조치필요'}
                          </p>
                        </div>
                        {result.notes && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              비고
                            </label>
                            <p className="text-gray-900 whitespace-pre-wrap">{result.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">점검 결과가 없습니다</p>
                )}

                <button
                  onClick={() => router.push('/inspections/tasks')}
                  className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
