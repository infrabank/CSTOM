'use client';

import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getAccessToken } from "@/lib/auth";
import Breadcrumb from "@/components/ui/breadcrumb";

interface SLAEvaluationReport {
  id: number;
  contract: number;
  contract_name: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  total_score: number | null;
  grade: string;
  grade_display: string;
  evaluator_notes: string;
  deduction_notes: string;
  is_finalized: boolean;
  scores: SLAEvaluationScore[];
  created_at: string;
  updated_at: string;
}

interface SLAEvaluationScore {
  id: number;
  evaluation_item: number;
  item_name: string;
  item_number: number;
  item_weight: number;
  category_name: string;
  service_level: number;
  score: number;
  system_name: string;
  occurrence_date: string | null;
  notes: string;
}

interface ScoresByCategory {
  [category: string]: {
    scores: SLAEvaluationScore[];
    subtotal: number;
    weight: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const GRADE_COLORS: Record<string, string> = {
  S: 'bg-success-bg text-success',
  A: 'bg-info-bg text-accent',
  B: 'bg-warning-bg text-warning',
  C: 'bg-danger-bg text-danger',
  D: 'bg-danger-bg text-danger',
};

function GradeBadge({ grade, gradeDisplay }: { grade: string; gradeDisplay: string }) {
  const colorClass = GRADE_COLORS[grade] || 'bg-surface-sunken text-text';
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {gradeDisplay}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function SLAEvaluationReportDetailPage() {
  const params = useParams();
  const reportId = params?.reportId as string;

  const [report, setReport] = useState<SLAEvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [actionError, setActionError] = useState('');

  const getHeaders = useCallback((): HeadersInit => {
    const token = getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v1/sla/evaluation-reports/${reportId}/`, { headers: getHeaders() });
      if (!res.ok) throw new Error('평가 보고서를 불러오지 못했습니다');
      const data = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '평가 보고서를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [reportId, getHeaders]);

  useEffect(() => {
    if (reportId) fetchReport();
  }, [reportId, fetchReport]);

  const handleCalculateScore = async () => {
    setIsCalculating(true);
    setActionError('');

    try {
      const token = getAccessToken();
      if (!token) throw new Error('인증 토큰이 없습니다');

      const res = await fetch(`${API_URL}/v1/sla/evaluation-reports/${reportId}/calculate_score/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData));
        }
        throw new Error(`서버 오류가 발생했습니다 (HTTP ${res.status})`);
      }

      await fetchReport();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '점수 산출에 실패했습니다');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('평가 보고서를 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.')) {
      return;
    }

    setIsFinalizing(true);
    setActionError('');

    try {
      const token = getAccessToken();
      if (!token) throw new Error('인증 토큰이 없습니다');

      const res = await fetch(`${API_URL}/v1/sla/evaluation-reports/${reportId}/finalize/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData));
        }
        throw new Error(`서버 오류가 발생했습니다 (HTTP ${res.status})`);
      }

      await fetchReport();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '확정에 실패했습니다');
    } finally {
      setIsFinalizing(false);
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

  if (error || !report) {
    return (
      <div>
        <Breadcrumb />
        <div className="mb-4">
          <Link href="/sla/evaluations" className="text-accent hover:underline text-sm">
            SLA 평가 보고서 목록으로
          </Link>
        </div>
        <div className="bg-danger-bg text-danger rounded-md p-4">
          {error || '평가 보고서를 찾을 수 없습니다'}
        </div>
      </div>
    );
  }

  // Group scores by category
  const scoresByCategory: ScoresByCategory = report.scores.reduce((acc, score) => {
    if (!acc[score.category_name]) {
      acc[score.category_name] = {
        scores: [],
        subtotal: 0,
        weight: 0,
      };
    }
    acc[score.category_name].scores.push(score);
    acc[score.category_name].subtotal += score.score;
    acc[score.category_name].weight += score.item_weight;
    return acc;
  }, {} as ScoresByCategory);

  return (
    <div>
      <Breadcrumb />
      <div className="mb-6">
        <Link href="/sla/evaluations" className="text-accent hover:underline text-sm">
          SLA 평가 보고서 목록으로
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger text-sm">{actionError}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text mb-2">SLA 평가 보고서</h1>
          <p className="text-text-muted">{report.contract_name}</p>
          <p className="text-sm text-text-muted mt-1">
            평가 기간: {formatDate(report.evaluation_period_start)} ~ {formatDate(report.evaluation_period_end)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-medium text-text-secondary mb-2">총점</h3>
            <p className="text-2xl font-semibold text-text">
              {report.total_score !== null ? report.total_score.toFixed(1) : '-'}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-medium text-text-secondary mb-2">등급</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold text-text">{report.grade}</p>
              <GradeBadge grade={report.grade} gradeDisplay={report.grade_display} />
            </div>
          </div>
          <div className="p-4 rounded-lg border border-border-light">
            <h3 className="text-sm font-medium text-text-secondary mb-2">상태</h3>
            <div className="flex items-center gap-2">
              {report.is_finalized ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-success-bg text-success">확정</span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-warning-bg text-warning">미확정</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scores Table */}
      <div className="bg-surface shadow-card rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b border-border-light">
          <h2 className="text-lg font-semibold">평가 점수</h2>
        </div>

        {report.scores.length === 0 ? (
          <div className="p-6 text-center text-text-muted">
            등록된 평가 점수가 없습니다
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">항목번호</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">항목명</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">가중치</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">서비스수준</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-text-secondary uppercase">점수</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-light">
                {Object.entries(scoresByCategory).map(([categoryName, categoryData]) => (
                  <React.Fragment key={categoryName}>
                    {/* Category Header */}
                    <tr className="bg-surface-sunken font-bold">
                      <td colSpan={5} className="px-6 py-3 text-sm text-text">
                        {categoryName} (가중치 {categoryData.weight}%)
                      </td>
                    </tr>
                    {/* Category Items */}
                    {categoryData.scores.map((score) => (
                      <tr key={score.id} className="hover:bg-surface-sunken">
                        <td className="px-6 py-4 text-sm text-text">{score.item_number}</td>
                        <td className="px-6 py-4 text-sm text-text">
                          <div className="font-medium">{score.item_name}</div>
                          {score.system_name && (
                            <div className="text-xs text-text-muted">{score.system_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-text">{score.item_weight}%</td>
                        <td className="px-6 py-4 text-sm text-text">{score.service_level}%</td>
                        <td className="px-6 py-4 text-sm text-text font-medium">{score.score.toFixed(1)}</td>
                      </tr>
                    ))}
                    {/* Category Subtotal */}
                    <tr className="bg-surface-sunken">
                      <td colSpan={4} className="px-6 py-3 text-sm text-text font-medium text-right">
                        {categoryName} 소계
                      </td>
                      <td className="px-6 py-3 text-sm text-text font-bold">
                        {categoryData.subtotal.toFixed(1)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {/* Grand Total */}
                <tr className="bg-surface-sunken">
                  <td colSpan={4} className="px-6 py-4 text-sm text-text font-bold text-right">
                    총점
                  </td>
                  <td className="px-6 py-4 text-sm text-text font-bold text-lg">
                    {report.total_score !== null ? report.total_score.toFixed(1) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes Section */}
      {(report.evaluator_notes || report.deduction_notes) && (
        <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">평가 메모</h2>
          {report.evaluator_notes && (
            <div className="mb-4 p-4 bg-surface-sunken rounded-lg border border-border-light">
              <h3 className="text-sm font-medium text-text-secondary mb-2">평가자 메모</h3>
              <p className="text-text whitespace-pre-wrap">{report.evaluator_notes}</p>
            </div>
          )}
          {report.deduction_notes && (
            <div className="p-4 bg-danger-bg rounded-lg border border-danger-border">
              <h3 className="text-sm font-medium text-text-secondary mb-2">감점요인</h3>
              <p className="text-text whitespace-pre-wrap">{report.deduction_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!report.is_finalized && (
          <>
            <button
              onClick={handleCalculateScore}
              disabled={isCalculating}
              className="px-4 py-2 bg-info-bg text-accent rounded-md hover:bg-info-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculating ? '산출 중...' : '점수 산출'}
            </button>
            <button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isFinalizing ? '확정 중...' : '확정'}
            </button>
          </>
        )}
        <Link
          href="/sla/evaluations"
          className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors"
        >
          목록
        </Link>
      </div>
    </div>
  );
}
