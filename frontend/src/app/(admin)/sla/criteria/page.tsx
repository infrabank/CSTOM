import { cookies } from "next/headers";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import Breadcrumb from "@/components/ui/breadcrumb";

interface Criteria {
  id: number;
  evaluation_item: number;
  item_name: string;
  item_number: number;
  service_level: string;
  criteria_text: string;
}

interface Category {
  id: number;
  name: string;
  code: string;
  weight_percent: number;
  items: {
    id: number;
    item_number: number;
    name: string;
    weight: number;
    criteria: Criteria[];
  }[];
}

const SERVICE_LEVELS = ["1.0", "0.8", "0.6", "0.4", "0.2"];

function formatLevel(level: string): string {
  const labels: Record<string, string> = {
    "1.0": "목표이상",
    "0.8": "최소이상",
    "0.6": "최소미만",
    "0.4": "미흡",
    "0.2": "매우미흡",
  };
  return labels[level] || level;
}

export default async function SLACriteriaPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let categories: Category[] = [];
  let error: string | null = null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const response = await fetch(`${apiUrl}/v1/sla/categories/tree/`, {
      next: { revalidate: 30 },
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error("배점기준 데이터를 불러오지 못했습니다");
    categories = (await response.json()) as Category[];
  } catch (e) {
    error = e instanceof Error ? e.message : "배점기준 데이터를 불러오지 못했습니다";
  }

  return (
    <div>
      <Breadcrumb />
      <h1 className="text-2xl font-semibold text-text mb-6">SLA 배점기준</h1>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      <Suspense fallback={<TableSkeleton rows={14} columns={7} />}>
        {categories.length === 0 && !error ? (
          <div className="bg-surface p-8 rounded-lg shadow-card text-center text-text-muted">
            배점기준 데이터가 없습니다. 먼저 SLA 카테고리와 항목을 등록하세요.
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
                <div className="bg-surface-sunken px-6 py-3 border-b border-border-light">
                  <h2 className="text-lg font-semibold text-text">
                    {category.name}
                    <span className="ml-2 text-sm font-normal text-text-muted">
                      (배점비율: {category.weight_percent}%)
                    </span>
                  </h2>
                </div>

                {/* Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-light">
                    <thead className="bg-surface-sunken">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase w-8">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase w-48">평가항목</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase w-12">배점</th>
                        {SERVICE_LEVELS.map((level) => (
                          <th key={level} className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">
                            {level}<br />
                            <span className="text-[10px] normal-case">{formatLevel(level)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                      {category.items.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-sunken">
                          <td className="px-4 py-3 text-sm text-text">{item.item_number}</td>
                          <td className="px-4 py-3 text-sm text-text font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-text text-center">{item.weight}</td>
                          {SERVICE_LEVELS.map((level) => {
                            const criteria = item.criteria.find(
                              (c) => c.service_level === level
                            );
                            return (
                              <td key={level} className="px-4 py-3 text-xs text-text-secondary text-center">
                                {criteria?.criteria_text || "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-border-light">
                  {category.items.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-text text-sm">
                          {item.item_number}. {item.name}
                        </span>
                        <span className="text-xs bg-surface-sunken px-2 py-1 rounded text-text-muted">
                          배점 {item.weight}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {SERVICE_LEVELS.map((level) => {
                          const criteria = item.criteria.find(
                            (c) => c.service_level === level
                          );
                          return criteria ? (
                            <div key={level} className="flex gap-2 text-xs">
                              <span className="shrink-0 w-8 font-medium text-text-muted">{level}</span>
                              <span className="text-text-secondary">{criteria.criteria_text}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Suspense>
    </div>
  );
}
