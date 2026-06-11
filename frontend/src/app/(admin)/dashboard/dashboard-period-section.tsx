"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary, type DashboardSummary } from "./dashboard-api";

const DashboardCharts = dynamic(() => import("@/components/dashboard-charts"), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-[280px] w-full" />
      </div>
    </div>
  ),
});

type Period = "today" | "week" | "month" | "quarter";

interface DashboardPeriodSectionProps {
  initialPeriod: Period;
  initialKpi: DashboardSummary | null;
}

export default function DashboardPeriodSection({
  initialPeriod,
  initialKpi,
}: DashboardPeriodSectionProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [kpiData, setKpiData] = useState<DashboardSummary | null>(initialKpi);
  const isInitial = period === initialPeriod;

  useEffect(() => {
    if (isInitial && kpiData) return;
    let cancelled = false;
    getDashboardSummary(period)
      .then((data) => {
        if (!cancelled) setKpiData(data);
      })
      .catch((error) => {
        console.error("Failed to load KPI data:", error);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const taskChartData = kpiData
    ? [
        { name: "대기", value: kpiData.task_summary.pending },
        { name: "진행중", value: kpiData.task_summary.in_progress },
        { name: "완료", value: kpiData.task_summary.completed },
      ]
    : [];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-text">대시보드</h1>
        <div className="flex gap-1.5 bg-surface-sunken rounded-lg p-1">
          {(["today", "week", "month", "quarter"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                period === p
                  ? "bg-accent text-text-on-accent shadow-card"
                  : "text-text-secondary hover:text-text hover:bg-surface-hover"
              }`}
            >
              {p === "today" ? "오늘" : p === "week" ? "주간" : p === "month" ? "월간" : "분기"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-success">
            <div className="text-sm font-medium text-text-muted mb-1">SLA 준수율</div>
            <div className={`text-3xl font-bold ${kpiData.sla_compliance_rate >= 90 ? "text-success" : kpiData.sla_compliance_rate >= 70 ? "text-warning" : "text-danger"}`}>
              {kpiData.sla_compliance_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-text-muted mt-1">목표: 90% 이상</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-info">
            <div className="text-sm font-medium text-text-muted mb-1">평균 복구 시간 (MTTR)</div>
            <div className="text-3xl font-bold text-info">
              {kpiData.mttr_hours.toFixed(1)}h
            </div>
            <div className="text-xs text-text-muted mt-1">시간 단위</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-accent">
            <div className="text-sm font-medium text-text-muted mb-1">예방점검 완료율</div>
            <div className={`text-3xl font-bold ${kpiData.inspection_completion_rate >= 80 ? "text-success" : "text-warning"}`}>
              {kpiData.inspection_completion_rate.toFixed(1)}%
            </div>
            <div className="text-xs text-text-muted mt-1">목표: 80% 이상</div>
          </div>

          <div className="bg-surface rounded-lg shadow-card border border-border-light p-5 border-l-4 border-l-secondary">
            <div className="text-sm font-medium text-text-muted mb-1">총 작업</div>
            <div className="text-3xl font-bold text-secondary">
              {kpiData.task_summary.total}
            </div>
            <div className="text-xs text-text-muted mt-1">
              완료 {kpiData.task_summary.completed} / 진행 {kpiData.task_summary.in_progress}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {kpiData && (
        <DashboardCharts
          taskChartData={taskChartData}
          slaComplianceRate={kpiData.sla_compliance_rate}
          inspectionCompletionRate={kpiData.inspection_completion_rate}
        />
      )}
    </>
  );
}
