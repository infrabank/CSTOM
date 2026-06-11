'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { tasksApi, eventsApi } from "@/lib/api";
import { slaDefinitionsApi, type SLAMetric } from "../api-local";
import Breadcrumb from "@/components/ui/breadcrumb";

interface SLADefinition {
  id: number;
  contract_name: string;
  service_type: string;
  priority: string;
  target_response_time_minutes: number;
  target_resolution_time_minutes: number;
  description: string;
  is_active: boolean;
  compliance_rate: number | null;
  created_at: string;
}

interface TaskItem {
  id: number;
  title: string;
}

interface EventItem {
  id: number;
  title: string;
  record_type: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-danger-bg text-danger',
  high: 'bg-warning-bg text-warning',
  medium: 'bg-info-bg text-info',
  low: 'bg-surface-sunken text-text',
};

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass = PRIORITY_COLORS[priority] || 'bg-surface-sunken text-text';
  const label = PRIORITY_LABELS[priority] || priority;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function ComplianceRateBadge({ rate }: { rate: number | null }) {
  if (rate === null || rate === undefined) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-surface-sunken text-text-muted">
        -
      </span>
    );
  }
  let colorClass = 'bg-danger-bg text-danger';
  if (rate > 90) {
    colorClass = 'bg-success-bg text-success';
  } else if (rate > 70) {
    colorClass = 'bg-warning-bg text-warning';
  }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function SLAMetBadge({ met }: { met: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        met
          ? 'bg-success-bg text-success'
          : 'bg-danger-bg text-danger'
      }`}
    >
      {met ? '준수' : '미준수'}
    </span>
  );
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours}시간`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ko-KR');
}

export default function SLADetailPage() {
  const params = useParams();
  const slaId = params?.slaId as string;

  const [sla, setSla] = useState<SLADefinition | null>(null);
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metric form state
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [metricTargetType, setMetricTargetType] = useState<'task' | 'event'>('task');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [metricObjectId, setMetricObjectId] = useState('');
  const [metricResponseTime, setMetricResponseTime] = useState('');
  const [metricResolutionTime, setMetricResolutionTime] = useState('');
  const [isMetricSubmitting, setIsMetricSubmitting] = useState(false);
  const [metricError, setMetricError] = useState('');

  const fetchSla = useCallback(async () => {
    const data = await slaDefinitionsApi.get(slaId);
    setSla(data);
  }, [slaId]);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await slaDefinitionsApi.metrics(slaId);
      setMetrics(Array.isArray(data) ? data : data.results || []);
    } catch {
      // silent
    }
  }, [slaId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [slaData, metricsData, tasksData, eventsData] = await Promise.all([
          slaDefinitionsApi.get(slaId),
          slaDefinitionsApi.metrics(slaId).catch(() => null),
          tasksApi.list().catch(() => null),
          eventsApi.list().catch(() => null),
        ]);

        setSla(slaData);

        if (metricsData) {
          setMetrics(Array.isArray(metricsData) ? metricsData : metricsData.results || []);
        }
        if (tasksData) {
          setTasks(tasksData.results || []);
        }
        if (eventsData) {
          setEvents(eventsData.results || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'SLA 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (slaId) fetchData();
  }, [slaId, fetchMetrics]);

  const handleMetricSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMetricSubmitting(true);
    setMetricError('');

    try {
      await slaDefinitionsApi.addMetric(slaId, {
        target_type: metricTargetType,
        target_id: parseInt(metricObjectId),
        actual_response_time_minutes: parseInt(metricResponseTime),
        actual_resolution_time_minutes: parseInt(metricResolutionTime),
      });

      setMetricObjectId('');
      setMetricResponseTime('');
      setMetricResolutionTime('');
      setShowMetricForm(false);
      await fetchMetrics();
      await fetchSla();
    } catch (err) {
      setMetricError(err instanceof Error ? err.message : '메트릭 등록에 실패했습니다');
    } finally {
      setIsMetricSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb />
        <div className="bg-surface shadow-card rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-sunken rounded w-1/3"></div>
            <div className="h-4 bg-surface-sunken rounded w-1/2"></div>
            <div className="h-4 bg-surface-sunken rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sla) {
    return (
      <div>
        <Breadcrumb />
        <div className="mb-4">
          <Link href="/sla" className="text-accent hover:underline text-sm">
            SLA 정의 목록으로
          </Link>
        </div>
        <div className="bg-danger-bg text-danger rounded-md p-4">
          {error || 'SLA 정보를 찾을 수 없습니다'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb />
      <div className="mb-6">
        <Link href="/sla" className="text-accent hover:underline text-sm">
          SLA 정의 목록으로
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text mb-2">{sla.service_type}</h1>
            <p className="text-text-muted">{sla.contract_name}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={sla.priority} />
            {sla.is_active ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-success-bg text-success">활성</span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-surface-sunken text-text">비활성</span>
            )}
          </div>
        </div>

        {sla.description && (
          <div className="mb-6 p-4 bg-surface-sunken rounded-lg border border-border-light">
            <h3 className="text-sm font-medium text-text-secondary mb-2">설명</h3>
            <p className="text-text-muted">{sla.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-info-bg rounded-lg border border-info-border">
            <h3 className="text-sm font-medium text-text-secondary mb-2">응답 목표</h3>
            <p className="text-2xl font-semibold text-accent">
              {formatTime(sla.target_response_time_minutes)}
            </p>
          </div>
          <div className="p-4 bg-info-bg rounded-lg border border-info-border">
            <h3 className="text-sm font-medium text-text-secondary mb-2">해결 목표</h3>
            <p className="text-2xl font-semibold text-accent">
              {formatTime(sla.target_resolution_time_minutes)}
            </p>
          </div>
          <div className="p-4 bg-surface-sunken rounded-lg border border-border-light">
            <h3 className="text-sm font-medium text-text-secondary mb-2">준수율</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-text">
                {sla.compliance_rate !== null && sla.compliance_rate !== undefined ? `${sla.compliance_rate.toFixed(1)}%` : '-'}
              </p>
              <ComplianceRateBadge rate={sla.compliance_rate} />
            </div>
          </div>
        </div>

        <div className="text-sm text-text-muted border-t border-border-light pt-4">
          <p>등록일: {formatDate(sla.created_at)}</p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="bg-surface shadow-card rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b border-border-light flex justify-between items-center">
          <h2 className="text-lg font-semibold">SLA 메트릭</h2>
          <button
            onClick={() => setShowMetricForm(!showMetricForm)}
            className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors text-sm font-medium"
          >
            {showMetricForm ? '닫기' : '메트릭 등록'}
          </button>
        </div>

        {/* Metric Form */}
        {showMetricForm && (
          <div className="p-6 border-b border-border-light bg-surface-sunken">
            {metricError && (
              <div className="mb-4 p-3 bg-danger-bg border border-danger-border rounded-md">
                <p className="text-danger text-sm">{metricError}</p>
              </div>
            )}
            <form onSubmit={handleMetricSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="metric-target-type" className="block text-sm font-medium text-text-secondary mb-1">
                    대상 유형 <span className="text-danger">*</span>
                  </label>
                  <select
                    id="metric-target-type"
                    value={metricTargetType}
                    onChange={(e) => {
                      setMetricTargetType(e.target.value as 'task' | 'event');
                      setMetricObjectId('');
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="task">작업 (Task)</option>
                    <option value="event">변경/장애 (Event)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="metric-object" className="block text-sm font-medium text-text-secondary mb-1">
                    대상 선택 <span className="text-danger">*</span>
                  </label>
                  <select
                    id="metric-object"
                    value={metricObjectId}
                    onChange={(e) => setMetricObjectId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  >
                    <option value="">선택하세요</option>
                    {metricTargetType === 'task'
                      ? tasks.map((t) => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))
                      : events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            [{ev.record_type === 'change' ? '변경' : '장애'}] {ev.title}
                          </option>
                        ))
                    }
                  </select>
                </div>

                <div>
                  <label htmlFor="metric-response" className="block text-sm font-medium text-text-secondary mb-1">
                    실제 응답 시간 (분) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    id="metric-response"
                    value={metricResponseTime}
                    onChange={(e) => setMetricResponseTime(e.target.value)}
                    required
                    min="0"
                    placeholder="예: 15"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="metric-resolution" className="block text-sm font-medium text-text-secondary mb-1">
                    실제 해결 시간 (분) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    id="metric-resolution"
                    value={metricResolutionTime}
                    onChange={(e) => setMetricResolutionTime(e.target.value)}
                    required
                    min="0"
                    placeholder="예: 120"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isMetricSubmitting}
                  className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isMetricSubmitting ? '등록 중...' : '메트릭 등록'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowMetricForm(false); setMetricError(''); }}
                  className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Metrics Table */}
        {metrics.length === 0 ? (
          <div className="p-6 text-center text-text-muted">
            등록된 메트릭이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">대상</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">응답 시간</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">해결 시간</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">응답 준수</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">해결 준수</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">기록일</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-light">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-surface-sunken">
                    <td className="px-6 py-4 text-sm text-text">
                      <div className="font-medium">{metric.object_display}</div>
                      <div className="text-xs text-text-muted">{metric.content_type_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text">{formatTime(metric.actual_response_time_minutes)}</td>
                    <td className="px-6 py-4 text-sm text-text">{formatTime(metric.actual_resolution_time_minutes)}</td>
                    <td className="px-6 py-4"><SLAMetBadge met={metric.response_sla_met} /></td>
                    <td className="px-6 py-4"><SLAMetBadge met={metric.resolution_sla_met} /></td>
                    <td className="px-6 py-4 text-sm text-text-muted">{formatDate(metric.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/sla/${sla.id}/edit`}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors"
        >
          수정
        </Link>
        <Link
          href="/sla"
          className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors"
        >
          목록
        </Link>
      </div>
    </div>
  );
}
