"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { slaReportsApi } from "../../../api-local";
import { getGradeInfo, SERVICE_LEVEL_OPTIONS } from "../../grade";

interface SLAEvaluationReport {
  id: number;
  contract: number;
  contract_name: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  total_score: number | null;
  grade: string;
  is_finalized: boolean;
  evaluator_notes: string;
  deduction_notes: string;
  scores: SLAEvaluationScore[];
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
  notes: string;
}

interface ScoreInput {
  evaluation_item: number;
  service_level: string;
  notes: string;
}

interface ScoresByCategory {
  [category: string]: {
    scores: SLAEvaluationScore[];
  };
}

export default function EditSLAEvaluationReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.reportId as string;

  const [report, setReport] = useState<SLAEvaluationReport | null>(null);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [evaluatorNotes, setEvaluatorNotes] = useState("");
  const [deductionNotes, setDeductionNotes] = useState("");
  const [scores, setScores] = useState<Record<number, ScoreInput>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await slaReportsApi.get<SLAEvaluationReport>(reportId);

        if (data.is_finalized) {
          setError("확정된 평가 보고서는 수정할 수 없습니다.");
          setIsLoading(false);
          return;
        }

        setReport(data);
        setPeriodStart(data.evaluation_period_start);
        setPeriodEnd(data.evaluation_period_end);
        setEvaluatorNotes(data.evaluator_notes || "");
        setDeductionNotes(data.deduction_notes || "");

        // Initialize scores from existing data
        const initialScores: Record<number, ScoreInput> = {};
        data.scores.forEach((s) => {
          initialScores[s.evaluation_item] = {
            evaluation_item: s.evaluation_item,
            service_level: String(s.service_level),
            notes: s.notes || "",
          };
        });
        setScores(initialScores);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "평가 보고서를 불러오지 못했습니다"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (reportId) fetchReport();
  }, [reportId]);

  const updateScore = (
    itemId: number,
    field: keyof ScoreInput,
    value: string
  ) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const calculateTotalScore = (): number => {
    if (!report) return 0;
    let total = 0;
    report.scores.forEach((s) => {
      const scoreData = scores[s.evaluation_item];
      if (scoreData) {
        const level = parseFloat(scoreData.service_level);
        total += s.item_weight * level;
      }
    });
    return Math.round(total * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Step 1: Update report metadata
      await slaReportsApi.update(reportId, {
        contract: report!.contract,
        evaluation_period_start: periodStart,
        evaluation_period_end: periodEnd,
        evaluator_notes: evaluatorNotes,
        deduction_notes: deductionNotes,
      });

      // Step 2: Update scores via bulk_scores
      await slaReportsApi.bulkScores(reportId, { scores: Object.values(scores) });

      // Step 3: Recalculate score
      await slaReportsApi.calculateScore(reportId);

      router.push(`/sla/evaluations/${reportId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "평가 보고서 수정에 실패했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link
            href={`/sla/evaluations/${reportId}`}
            className="text-accent hover:underline text-sm"
          >
            평가 보고서로 돌아가기
          </Link>
        </div>
        <div className="p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  // Group scores by category
  const scoresByCategory: ScoresByCategory = report.scores.reduce(
    (acc, score) => {
      if (!acc[score.category_name]) {
        acc[score.category_name] = { scores: [] };
      }
      acc[score.category_name].scores.push(score);
      return acc;
    },
    {} as ScoresByCategory
  );

  const totalScore = calculateTotalScore();
  const gradeInfo = getGradeInfo(totalScore);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/sla/evaluations/${reportId}`}
          className="text-accent hover:underline text-sm"
        >
          평가 보고서로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold mt-2">SLA 평가 보고서 수정</h1>
        <p className="text-text-muted text-sm mt-1">{report.contract_name}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Period & Notes */}
        <div className="bg-surface shadow-card rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold">기본 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="periodStart"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                평가 시작일 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                id="periodStart"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="periodEnd"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                평가 종료일 <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                id="periodEnd"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="evaluatorNotes"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              평가자 메모
            </label>
            <textarea
              id="evaluatorNotes"
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="평가에 대한 메모를 입력하세요"
            />
          </div>

          <div>
            <label
              htmlFor="deductionNotes"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              감점요인 기록
            </label>
            <textarea
              id="deductionNotes"
              value={deductionNotes}
              onChange={(e) => setDeductionNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="감점요인을 기록하세요"
            />
          </div>
        </div>

        {/* Scores Table */}
        {report.scores.length > 0 && (
          <div className="bg-surface shadow-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">평가 항목</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      항목번호
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      평가항목
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      가중치
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      서비스 수준
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      점수
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      비고
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(scoresByCategory).map(
                    ([categoryName, categoryData]) => (
                      <React.Fragment key={categoryName}>
                        <tr className="bg-surface-sunken">
                          <td colSpan={6} className="px-4 py-3 font-semibold">
                            {categoryName}
                          </td>
                        </tr>
                        {categoryData.scores.map((s) => {
                          const scoreData = scores[s.evaluation_item];
                          const level = scoreData
                            ? parseFloat(scoreData.service_level)
                            : Number(s.service_level);
                          const calculatedScore =
                            Math.round(s.item_weight * level * 100) / 100;

                          return (
                            <tr
                              key={s.id}
                              className="border-b border-border hover:bg-surface-sunken"
                            >
                              <td className="px-4 py-3 text-sm">
                                {s.item_number}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {s.item_name}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {s.item_weight}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={
                                    scoreData?.service_level ||
                                    String(s.service_level)
                                  }
                                  onChange={(e) =>
                                    updateScore(
                                      s.evaluation_item,
                                      "service_level",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                >
                                  {SERVICE_LEVEL_OPTIONS.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {calculatedScore}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={scoreData?.notes ?? s.notes ?? ""}
                                  onChange={(e) =>
                                    updateScore(
                                      s.evaluation_item,
                                      "notes",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                  placeholder="비고 입력"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Score Summary */}
        <div className="bg-surface shadow-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">평가 결과 (예상)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-sunken rounded-md">
              <p className="text-sm text-text-secondary mb-1">총점</p>
              <p className="text-2xl font-bold">{totalScore}</p>
            </div>
            <div className="p-4 bg-surface-sunken rounded-md">
              <p className="text-sm text-text-secondary mb-1">등급</p>
              <p className="text-2xl font-bold">
                {gradeInfo.grade} ({gradeInfo.label})
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
          <Link
            href={`/sla/evaluations/${reportId}`}
            className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
