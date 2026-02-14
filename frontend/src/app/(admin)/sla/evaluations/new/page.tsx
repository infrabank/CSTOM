"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";

interface Contract {
  id: number;
  name: string;
}

interface SLAEvaluationItem {
  id: number;
  item_number: number;
  name: string;
  weight: number;
  category_name: string;
  criteria: { service_level: string; criteria_text: string }[];
}

interface SLACategory {
  id: number;
  name: string;
  code: string;
  weight_percent: number;
  items: SLAEvaluationItem[];
}

interface ScoreInput {
  evaluation_item: number;
  service_level: string;
  notes: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const SERVICE_LEVEL_OPTIONS = [
  { value: "1.0", label: "1.0 (목표이상)" },
  { value: "0.8", label: "0.8 (최소이상)" },
  { value: "0.6", label: "0.6 (최소미만)" },
  { value: "0.4", label: "0.4 (미흡)" },
  { value: "0.2", label: "0.2 (매우미흡)" },
];

const getGradeInfo = (score: number): { grade: string; label: string } => {
  if (score >= 96) return { grade: "S", label: "탁월" };
  if (score >= 90) return { grade: "A", label: "우수" };
  if (score >= 85) return { grade: "B", label: "보통" };
  if (score >= 80) return { grade: "C", label: "최저" };
  return { grade: "D", label: "불가" };
};

export default function NewSLAEvaluationReportPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractId, setContractId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [categories, setCategories] = useState<SLACategory[]>([]);
  const [scores, setScores] = useState<Record<number, ScoreInput>>({});

  const [autoEvaluated, setAutoEvaluated] = useState<Set<number>>(new Set());
  const [isAutoEvaluating, setIsAutoEvaluating] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch contracts on mount
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = getAccessToken();

        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const contractsRes = await fetch(`${API_URL}/v1/contracts/`, { headers });
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || contractsData || []);
        }
      } catch (err) {
        console.error("Failed to fetch contracts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const handleLoadItems = async () => {
    if (!contractId) {
      setError("사업을 선택하세요");
      return;
    }

    setError("");
    setIsLoadingItems(true);

    try {
      const token = getAccessToken();

      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(
        `${API_URL}/v1/sla/categories/?contract=${contractId}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error("평가항목을 불러오는데 실패했습니다");
      }

      const data = await res.json();
      const categoriesData = data.results || data || [];
      setCategories(categoriesData);

      // Initialize scores
      const initialScores: Record<number, ScoreInput> = {};
      categoriesData.forEach((category: SLACategory) => {
        category.items.forEach((item: SLAEvaluationItem) => {
          initialScores[item.id] = {
            evaluation_item: item.id,
            service_level: "1.0",
            notes: "",
          };
        });
      });
      setScores(initialScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "평가항목을 불러오는데 실패했습니다");
      console.error(err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleAutoEvaluate = async () => {
    if (!contractId || !periodStart || !periodEnd) {
      setError("자동 채점을 위해 사업과 평가기간을 먼저 설정하세요");
      return;
    }
    if (categories.length === 0) {
      setError("평가항목을 먼저 불러오세요");
      return;
    }

    setError("");
    setIsAutoEvaluating(true);

    try {
      const token = getAccessToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(
        `${API_URL}/v1/sla/evaluation-reports/auto_evaluate/?contract=${contractId}&period_start=${periodStart}&period_end=${periodEnd}`,
        { headers }
      );

      if (!res.ok) {
        const errMsg = await parseApiError(res, "자동 채점에 실패했습니다");
        throw new Error(errMsg);
      }

      const data: Record<string, { service_level: string; notes: string; metric_value: string }> = await res.json();

      // Map item_number from API response to item IDs in the categories
      const newAutoSet = new Set<number>();
      const updatedScores = { ...scores };

      categories.forEach((category) => {
        category.items.forEach((item) => {
          const autoResult = data[String(item.item_number)];
          if (autoResult) {
            updatedScores[item.id] = {
              ...updatedScores[item.id],
              service_level: autoResult.service_level,
              notes: autoResult.notes,
            };
            newAutoSet.add(item.id);
          }
        });
      });

      setScores(updatedScores);
      setAutoEvaluated(newAutoSet);

      const autoCount = Object.keys(data).length;
      const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);
      const manualCount = totalItems - autoCount;
      alert(`자동 채점 완료: ${autoCount}개 항목 자동산출, ${manualCount}개 항목 수동 입력 필요`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "자동 채점에 실패했습니다");
    } finally {
      setIsAutoEvaluating(false);
    }
  };

  const updateScore = (itemId: number, field: keyof ScoreInput, value: string) => {
    setScores((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const calculateTotalScore = (): number => {
    let total = 0;

    categories.forEach((category) => {
      category.items.forEach((item) => {
        const scoreData = scores[item.id];
        if (scoreData) {
          const level = parseFloat(scoreData.service_level);
          total += item.weight * level;
        }
      });
    });

    return Math.round(total * 100) / 100;
  };

  const parseApiError = async (res: Response, fallbackMsg: string): Promise<string> => {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        if (data.detail) return `${data.detail} (HTTP ${res.status})`;
        if (data.error) return `${data.error} (HTTP ${res.status})`;
        if (data.non_field_errors) {
          const errs = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(", ") : data.non_field_errors;
          return `${errs} (HTTP ${res.status})`;
        }
        // DRF field-level errors: { "field": ["error1", "error2"] }
        const fieldErrors = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
          .join("; ");
        if (fieldErrors) return `${fieldErrors} (HTTP ${res.status})`;
      }
      const text = await res.text().catch(() => "");
      if (text) return `${fallbackMsg} (HTTP ${res.status}): ${text.slice(0, 200)}`;
    } catch {
      // ignore parse errors
    }
    return `${fallbackMsg} (HTTP ${res.status})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();

      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      // Step 1: Create evaluation report
      const reportPayload = {
        contract: parseInt(contractId),
        evaluation_period_start: periodStart,
        evaluation_period_end: periodEnd,
      };

      console.log("[SLA] Step 1: Creating report", reportPayload);

      let reportRes: Response;
      try {
        reportRes = await fetch(`${API_URL}/v1/sla/evaluation-reports/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reportPayload),
        });
      } catch (fetchErr) {
        console.error("[SLA] Network error creating report:", fetchErr);
        throw new Error(`서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요. (${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)})`);
      }

      console.log("[SLA] Step 1 response:", reportRes.status, reportRes.statusText);

      if (!reportRes.ok) {
        const errMsg = await parseApiError(reportRes, "평가 리포트 생성에 실패했습니다");
        console.error("[SLA] Step 1 failed:", errMsg);
        throw new Error(errMsg);
      }

      const reportData = await reportRes.json();
      const reportId = reportData.id;
      console.log("[SLA] Step 1 success: report id =", reportId);

      // Step 2: Bulk create scores
      const scoresPayload = {
        scores: Object.values(scores),
      };

      console.log("[SLA] Step 2: Saving", scoresPayload.scores.length, "scores");

      let scoresRes: Response;
      try {
        scoresRes = await fetch(
          `${API_URL}/v1/sla/evaluation-reports/${reportId}/bulk_scores/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(scoresPayload),
          }
        );
      } catch (fetchErr) {
        console.error("[SLA] Network error saving scores:", fetchErr);
        throw new Error(`점수 저장 중 서버 연결에 실패했습니다. (${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)})`);
      }

      console.log("[SLA] Step 2 response:", scoresRes.status, scoresRes.statusText);

      if (!scoresRes.ok) {
        const errMsg = await parseApiError(scoresRes, "평가 점수 저장에 실패했습니다");
        console.error("[SLA] Step 2 failed:", errMsg);
        throw new Error(errMsg);
      }

      console.log("[SLA] Step 2 success");

      // Step 3: Calculate final score
      console.log("[SLA] Step 3: Calculating score");

      let calcRes: Response;
      try {
        calcRes = await fetch(
          `${API_URL}/v1/sla/evaluation-reports/${reportId}/calculate_score/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (fetchErr) {
        console.error("[SLA] Network error calculating score:", fetchErr);
        throw new Error(`점수 계산 중 서버 연결에 실패했습니다. (${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)})`);
      }

      console.log("[SLA] Step 3 response:", calcRes.status, calcRes.statusText);

      if (!calcRes.ok) {
        const errMsg = await parseApiError(calcRes, "평가 점수 계산에 실패했습니다");
        console.error("[SLA] Step 3 failed:", errMsg);
        throw new Error(errMsg);
      }

      console.log("[SLA] All steps complete, redirecting to report", reportId);
      router.push(`/sla/evaluations/${reportId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "평가 리포트 생성에 실패했습니다";
      setError(message);
      console.error("[SLA] Submit error:", message, err);
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

  const totalScore = calculateTotalScore();
  const gradeInfo = getGradeInfo(totalScore);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">새 SLA 평가 리포트 등록</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface shadow-card rounded-lg p-6 space-y-6">
          <h2 className="text-lg font-semibold">기본 정보</h2>

          <div>
            <label htmlFor="contract" className="block text-sm font-medium text-text-secondary mb-2">
              관련 사업 <span className="text-danger">*</span>
            </label>
            <select
              id="contract"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">사업을 선택하세요</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="periodStart" className="block text-sm font-medium text-text-secondary mb-2">
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
              <label htmlFor="periodEnd" className="block text-sm font-medium text-text-secondary mb-2">
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

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleLoadItems}
              disabled={isLoadingItems || !contractId}
              className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingItems ? "불러오는 중..." : "평가항목 불러오기"}
            </button>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={handleAutoEvaluate}
                disabled={isAutoEvaluating || !periodStart || !periodEnd}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAutoEvaluating ? "자동 채점 중..." : "자동 채점"}
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <>
            <div className="bg-surface shadow-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">평가 항목</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">항목번호</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">평가항목</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">가중치</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">서비스 수준</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">점수</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">배점기준</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <React.Fragment key={`category-${category.id}`}>
                        <tr className="bg-surface-sunken">
                          <td colSpan={7} className="px-4 py-3 font-semibold">
                            {category.name} (카테고리 가중치: {category.weight_percent}%)
                          </td>
                        </tr>
                        {category.items.map((item) => {
                          const scoreData = scores[item.id];
                          const level = scoreData ? parseFloat(scoreData.service_level) : 1.0;
                          const calculatedScore = Math.round(item.weight * level * 100) / 100;

                          return (
                            <tr key={item.id} className="border-b border-border hover:bg-surface-sunken">
                              <td className="px-4 py-3 text-sm">{item.item_number}</td>
                              <td className="px-4 py-3 text-sm">
                                {item.name}
                                {autoEvaluated.has(item.id) && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                    자동
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">{item.weight}</td>
                              <td className="px-4 py-3">
                                <select
                                  value={scoreData?.service_level || "1.0"}
                                  onChange={(e) =>
                                    updateScore(item.id, "service_level", e.target.value)
                                  }
                                  className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                >
                                  {SERVICE_LEVEL_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">{calculatedScore}</td>
                              <td className="px-4 py-3 text-xs text-text-secondary max-w-xs">
                                {item.criteria?.find(c => c.service_level === (scoreData?.service_level || "1.0"))?.criteria_text || ""}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={scoreData?.notes || ""}
                                  onChange={(e) => updateScore(item.id, "notes", e.target.value)}
                                  className="w-full px-2 py-1 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                  placeholder="비고 입력"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface shadow-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">평가 결과</h2>
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

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "등록 중..." : "평가 리포트 등록"}
              </button>
              <Link
                href="/sla/evaluations"
                className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken"
              >
                취소
              </Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
