"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#0369A1", "#15803D", "#A16207", "#B91C1C"];

interface DashboardChartsProps {
  taskChartData: { name: string; value: number }[];
  slaComplianceRate: number;
  inspectionCompletionRate: number;
}

export default function DashboardCharts({
  taskChartData,
  slaComplianceRate,
  inspectionCompletionRate,
}: DashboardChartsProps) {
  const barData = [
    { name: "SLA 준수율", value: slaComplianceRate },
    { name: "점검 완료율", value: inspectionCompletionRate },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4 mb-6">
      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <h2 className="text-base font-semibold text-text mb-4">작업 현황</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={taskChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {taskChartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface rounded-lg shadow-card border border-border-light p-5">
        <h2 className="text-base font-semibold text-text mb-4">KPI 요약</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="value"
              fill="#0369A1"
              name="비율 (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
