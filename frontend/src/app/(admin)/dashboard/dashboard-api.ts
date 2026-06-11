/**
 * Local client-side wrapper for the dashboard summary endpoint.
 *
 * `@/lib/api` exposes no dashboard helper, so this small typed wrapper uses
 * the shared `clientFetch` (401 -> refresh -> retry) to keep the access token
 * fresh.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface DashboardSummary {
  sla_compliance_rate: number;
  mttr_hours: number;
  inspection_completion_rate: number;
  task_summary: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
}

export function getDashboardSummary(period: string): Promise<DashboardSummary> {
  return clientFetch.get<DashboardSummary>(
    `/v1/dashboard/summary/?period=${period}`,
  );
}
