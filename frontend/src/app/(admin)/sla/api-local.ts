/**
 * Local typed API wrappers for SLA endpoints that are not covered by the
 * shared `@/lib/api` helpers (SLA definitions CRUD + metrics, category trees,
 * evaluation-report lifecycle actions).
 *
 * Built on `clientFetch` (@/lib/client-fetch), which provides the shared
 * 401 -> single-flight refresh -> retry flow for client pages.
 */

import { clientFetch } from "@/lib/client-fetch";

// ---- SLA Definitions ----

export interface SLADefinitionDetail {
  id: number;
  contract: number;
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

export interface SLADefinitionInput {
  contract: number;
  service_type: string;
  priority: string;
  target_response_time_minutes: number;
  target_resolution_time_minutes: number;
  description?: string;
  is_active: boolean;
}

export interface SLAMetric {
  id: number;
  content_type_name: string;
  object_display: string;
  actual_response_time_minutes: number;
  actual_resolution_time_minutes: number;
  response_sla_met: boolean;
  resolution_sla_met: boolean;
  created_at: string;
}

export interface SLAMetricInput {
  target_type: "task" | "event";
  target_id: number;
  actual_response_time_minutes: number;
  actual_resolution_time_minutes: number;
}

export const slaDefinitionsApi = {
  get: (id: string | number) =>
    clientFetch.get<SLADefinitionDetail>(`/v1/sla/definitions/${id}/`),

  create: (data: SLADefinitionInput) =>
    clientFetch.post<SLADefinitionDetail>("/v1/sla/definitions/", data),

  update: (id: string | number, data: SLADefinitionInput) =>
    clientFetch.put<SLADefinitionDetail>(`/v1/sla/definitions/${id}/`, data),

  metrics: (id: string | number) =>
    clientFetch.get<{ results?: SLAMetric[] } | SLAMetric[]>(
      `/v1/sla/definitions/${id}/metrics/`,
    ),

  addMetric: (id: string | number, data: SLAMetricInput) =>
    clientFetch.post<SLAMetric>(`/v1/sla/definitions/${id}/add_metric/`, data),
};

// ---- SLA Categories (by contract / tree) ----

export interface SLAEvaluationCategoryItem {
  id: number;
  item_number: number;
  name: string;
  weight: number;
  category_name?: string;
  criteria: { service_level: string; criteria_text: string }[];
}

export interface SLAEvaluationCategory {
  id: number;
  name: string;
  code: string;
  weight_percent: number;
  items: SLAEvaluationCategoryItem[];
}

export const slaCategoriesApi = {
  listByContract: (contractId: string | number) =>
    clientFetch.get<{ results?: SLAEvaluationCategory[] } | SLAEvaluationCategory[]>(
      `/v1/sla/categories/?contract=${contractId}`,
    ),
};

// ---- SLA Evaluation Reports (lifecycle actions) ----

export interface EvaluationReportInput {
  contract: number;
  evaluation_period_start: string;
  evaluation_period_end: string;
  evaluator_notes?: string;
  deduction_notes?: string;
}

export interface BulkScoresInput {
  scores: { evaluation_item: number; service_level: string; notes: string }[];
}

export interface AutoEvaluateResult {
  [itemNumber: string]: {
    service_level: string;
    notes: string;
    metric_value: string;
  };
}

export const slaReportsApi = {
  get: <T>(id: string | number) =>
    clientFetch.get<T>(`/v1/sla/evaluation-reports/${id}/`),

  create: <T>(data: EvaluationReportInput) =>
    clientFetch.post<T>("/v1/sla/evaluation-reports/", data),

  update: <T>(id: string | number, data: Partial<EvaluationReportInput>) =>
    clientFetch.patch<T>(`/v1/sla/evaluation-reports/${id}/`, data),

  remove: (id: string | number) =>
    clientFetch.del(`/v1/sla/evaluation-reports/${id}/`),

  bulkScores: (id: string | number, data: BulkScoresInput) =>
    clientFetch.post<unknown>(
      `/v1/sla/evaluation-reports/${id}/bulk_scores/`,
      data,
    ),

  calculateScore: (id: string | number) =>
    clientFetch.post<unknown>(
      `/v1/sla/evaluation-reports/${id}/calculate_score/`,
    ),

  finalize: (id: string | number) =>
    clientFetch.post<unknown>(`/v1/sla/evaluation-reports/${id}/finalize/`),

  autoEvaluate: (
    contractId: string | number,
    periodStart: string,
    periodEnd: string,
  ) =>
    clientFetch.get<AutoEvaluateResult>(
      `/v1/sla/evaluation-reports/auto_evaluate/?contract=${contractId}&period_start=${periodStart}&period_end=${periodEnd}`,
    ),

  uptimeSummary: <T>(id: string | number) =>
    clientFetch.get<T>(`/v1/sla/evaluation-reports/${id}/uptime_summary/`),
};
