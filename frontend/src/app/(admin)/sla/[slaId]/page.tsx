'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface SLADefinition {
  id: number;
  contract_name: string;
  service_type: string;
  priority: string;
  target_response_time_minutes: number;
  target_resolution_time_minutes: number;
  description: string;
  is_active: boolean;
  compliance_rate: number;
  created_at: string;
}

interface SLAMetric {
  id: number;
  content_type_name: string;
  object_display: string;
  actual_response_time_minutes: number;
  actual_resolution_time_minutes: number;
  response_sla_met: boolean;
  resolution_sla_met: boolean;
  created_at: string;
}

interface MetricsResponse {
  results: SLAMetric[];
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

function PriorityBadge({ priority }: { priority: string }) {
  const colorClass = PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-800';
  const label = PRIORITY_LABELS[priority] || priority;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function ComplianceRateBadge({ rate }: { rate: number }) {
  let colorClass = 'bg-red-100 text-red-800';
  if (rate > 90) {
    colorClass = 'bg-green-100 text-green-800';
  } else if (rate > 70) {
    colorClass = 'bg-yellow-100 text-yellow-800';
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
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('cstom_access_token='))
          ?.split('=')[1];

        // Fetch SLA definition
        const slaResponse = await fetch(
          `${apiUrl}/v1/sla/definitions/${slaId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!slaResponse.ok) {
          throw new Error('SLA 정의를 불러오지 못했습니다');
        }

        const slaData: SLADefinition = await slaResponse.json();
        setSla(slaData);

        // Fetch metrics
        const metricsResponse = await fetch(
          `${apiUrl}/v1/sla/definitions/${slaId}/metrics/`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!metricsResponse.ok) {
          throw new Error('SLA 메트릭을 불러오지 못했습니다');
        }

        const metricsData: MetricsResponse = await metricsResponse.json();
        setMetrics(metricsData.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'SLA 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (slaId) {
      fetchData();
    }
  }, [slaId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sla) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link href="/sla" className="text-blue-600 hover:underline text-sm">
            SLA 정의 목록으로
          </Link>
        </div>
        <div className="bg-red-50 text-red-700 rounded-md p-4">
          {error || 'SLA 정보를 찾을 수 없습니다'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/sla" className="text-blue-600 hover:underline text-sm">
          SLA 정의 목록으로
        </Link>
      </div>

      {/* Main Card */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{sla.service_type}</h1>
            <p className="text-gray-600">{sla.contract_name}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={sla.priority} />
            {sla.is_active ? (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                활성
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                비활성
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {sla.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">설명</h3>
            <p className="text-gray-600">{sla.description}</p>
          </div>
        )}

        {/* SLA Targets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">응답 목표</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatTime(sla.target_response_time_minutes)}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">해결 목표</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatTime(sla.target_resolution_time_minutes)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">준수율</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-800">
                {sla.compliance_rate.toFixed(1)}%
              </p>
              <ComplianceRateBadge rate={sla.compliance_rate} />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
          <p>등록일: {formatDate(sla.created_at)}</p>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">SLA 메트릭</h2>
        </div>

        {metrics.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            등록된 메트릭이 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    대상
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    응답 시간
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    해결 시간
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    응답 준수
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    해결 준수
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 uppercase">
                    기록일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{metric.object_display}</div>
                      <div className="text-xs text-gray-500">{metric.content_type_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(metric.actual_response_time_minutes)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatTime(metric.actual_resolution_time_minutes)}
                    </td>
                    <td className="px-6 py-4">
                      <SLAMetBadge met={metric.response_sla_met} />
                    </td>
                    <td className="px-6 py-4">
                      <SLAMetBadge met={metric.resolution_sla_met} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(metric.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Link
          href={`/sla/${sla.id}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          수정
        </Link>
        <Link
          href="/sla"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          취소
        </Link>
      </div>
    </div>
  );
}
