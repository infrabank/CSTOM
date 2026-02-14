/**
 * API client for CSTOM backend.
 */

import { getAccessToken, setTokens, clearTokens, TokenPair } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Contract {
  id: number;
  name: string;
  client_org: string;
  start_date: string;
  end_date: string;
  contract_amount: string | null;
  status: string;
  scopes: string[];
  risk_flags: {
    pre_env: boolean;
    prior_vendor_coordination: boolean;
    docs_incomplete: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ContractListItem {
  id: number;
  name: string;
  client_org: string;
  start_date: string;
  end_date: string;
  status: string;
  scopes: string[];
  risk_flags: {
    pre_env: boolean;
    prior_vendor_coordination: boolean;
    docs_incomplete: boolean;
  };
  created_at: string;
}

export interface ContractCreateInput {
  name: string;
  client_org: string;
  start_date: string;
  end_date: string;
  contract_amount?: string;
  scope_list?: string[];
  status?: string;
  risk_pre_env?: boolean;
  risk_prior_vendor?: boolean;
  risk_docs_incomplete?: boolean;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {},
  _isRetry = false
): Promise<T> {
  const { token: providedToken, ...fetchOptions } = options;
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = providedToken ?? getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...headers,
      ...fetchOptions.headers,
    },
  });

  // Handle 401 Unauthorized - attempt token refresh once
  if (res.status === 401 && !_isRetry && !providedToken) {
    const refreshed = await authApi.refresh();
    if (refreshed) {
      // Retry with new token
      return fetchAPI<T>(endpoint, options, true);
    }
    // Refresh failed - redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const message = error?.error?.message
      || error?.detail
      || error?.message
      || (typeof error === 'string' ? error : JSON.stringify(error))
      || `API error: ${res.status}`;
    throw new Error(message);
  }

  // Handle empty responses (e.g., 204 No Content for DELETE)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json();
}

export const contractsApi = {
  list: (token?: string) => fetchAPI<{ results: ContractListItem[] }>("/v1/contracts/", { token }),

  get: (id: number, token?: string) => fetchAPI<Contract>(`/v1/contracts/${id}/`, { token }),

  create: (data: ContractCreateInput, token?: string) =>
    fetchAPI<Contract>("/v1/contracts/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: number, data: Partial<ContractCreateInput>, token?: string) =>
    fetchAPI<Contract>(`/v1/contracts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  updateStatus: (id: number, status: string, notes?: string, token?: string) =>
    fetchAPI<Contract>(`/v1/contracts/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
      token,
    }),

};

export interface Report {
  id: number;
  contract: number;
  contract_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  summary: string;
  integrity_hash: string;
}

export interface ReportListItem {
  id: number;
  contract: number;
  contract_name: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
}

export const reportsApi = {
  list: (token?: string) => fetchAPI<{ results: ReportListItem[] }>("/v1/reports/", { token }),

  get: (id: number, token?: string) => fetchAPI<Report>(`/v1/reports/${id}/`, { token }),
};

export interface EquipmentTransaction {
  id: number;
  equipment: number;
  transaction_type: string;
  transaction_type_display: string;
  handler_name: string;
  handler_affiliation: string;
  handler_contact: string;
  purpose: string;
  expected_return_date: string | null;
  transaction_date: string;
  notes: string;
}

export interface Equipment {
  id: number;
  contract: number;
  contract_name: string;
  name: string;
  category: string;
  category_display: string;
  serial_number: string;
  model_name: string;
  manufacturer: string;
  location: string;
  status: string;
  status_display: string;
  notes: string;
  // CMDB fields
  purchase_date: string | null;
  warranty_expiry_date: string | null;
  ip_address: string | null;
  mac_address: string | null;
  operating_system: string | null;
  created_at: string;
  updated_at: string;
  recent_transactions: EquipmentTransaction[];
}

export interface EquipmentListItem {
  id: number;
  contract: number;
  contract_name: string;
  name: string;
  category: string;
  category_display: string;
  serial_number: string;
  model_name: string;
  status: string;
  status_display: string;
  location: string;
  last_transaction: {
    type: string;
    type_display: string;
    handler_name: string;
    date: string;
  } | null;
  created_at: string;
}

export interface EquipmentCreateInput {
  contract: number;
  name: string;
  category: string;
  serial_number: string;
  model_name?: string;
  manufacturer?: string;
  location?: string;
  status?: string;
  notes?: string;
}

export interface EquipmentTransactionInput {
  transaction_type?: string;
  handler_name: string;
  handler_affiliation?: string;
  handler_contact?: string;
  rationale?: string;
  expected_return_date?: string;
  notes?: string;
}

export const equipmentsApi = {
  list: (token?: string) =>
    fetchAPI<{ results: EquipmentListItem[] }>("/v1/equipments/", { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Equipment>(`/v1/equipments/${id}/`, { token }),

  create: (data: EquipmentCreateInput, token?: string) =>
    fetchAPI<Equipment>("/v1/equipments/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: number, data: Partial<EquipmentCreateInput>, token?: string) =>
    fetchAPI<Equipment>(`/v1/equipments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: number, token?: string) =>
    fetchAPI<void>(`/v1/equipments/${id}/`, {
      method: "DELETE",
      token,
    }),

  checkOut: (id: number, data: EquipmentTransactionInput, token?: string) =>
    fetchAPI<EquipmentTransaction>(`/v1/equipments/${id}/check-out/`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  checkIn: (id: number, data: EquipmentTransactionInput, token?: string) =>
    fetchAPI<EquipmentTransaction>(`/v1/equipments/${id}/check-in/`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  transactions: (id: number, token?: string) =>
    fetchAPI<EquipmentTransaction[]>(`/v1/equipments/${id}/transactions/`, { token }),
};

export interface Task {
  id: number;
  contract: number;
  contract_name: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  approval_status: string;
  approved_by: string;
  approved_at: string | null;
  title: string;
  description: string;
  related_incident: number | null;
  related_incident_title: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListItem {
  id: number;
  contract: number;
  contract_name: string;
  task_type: string;
  impact_level: string;
  approval_required: boolean;
  approval_status: string;
  title: string;
  created_at: string;
}

export interface DecisionLog {
  id: number;
  task: number;
  actor_role: string;
  rationale_checklist: Record<string, boolean>;
  rationale_notes: string;
  alternatives_considered: boolean;
  risk_acknowledged: boolean;
  created_at: string;
}

export const tasksApi = {
  list: (token?: string) =>
    fetchAPI<{ results: TaskListItem[] }>("/v1/tasks/", { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Task>(`/v1/tasks/${id}/`, { token }),

  decisions: (taskId: number, token?: string) =>
    fetchAPI<{ results: DecisionLog[] }>(`/v1/decisions/?task=${taskId}`, { token }),

  approve: (id: number, action: "approve" | "reject", notes?: string, token?: string) =>
    fetchAPI<Task>(`/v1/tasks/${id}/approve/`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
      token,
    }),
};

export interface Event {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  description: string;
  occurred_at: string;
  detected_at: string | null;
  resolved_at: string | null;
  customer_notified: boolean;
  customer_notified_at: string | null;
  related_event: number | null;
  related_event_title: string | null;
  summary_notice: string;
  audit_summary: string;
  created_at: string;
}

export interface EventListItem {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  occurred_at: string;
  resolved_at: string | null;
  created_at: string;
}

export const eventsApi = {
  list: (token?: string) =>
    fetchAPI<{ results: EventListItem[] }>("/v1/events/", { token }),

  listByContract: (contractId: number, token?: string) =>
    fetchAPI<{ results: EventListItem[] }>(`/v1/events/?contract=${contractId}`, { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Event>(`/v1/events/${id}/`, { token }),

  link: (id: number, relatedEventId: number, token?: string) =>
    fetchAPI<Event>(`/v1/events/${id}/link/`, {
      method: "POST",
      body: JSON.stringify({ related_event: relatedEventId }),
      token,
    }),

  unlink: (id: number, token?: string) =>
    fetchAPI<Event>(`/v1/events/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ related_event: null }),
      token,
    }),
};

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsApi = {
  list: (token?: string) =>
    fetchAPI<{ results: Notification[] }>("/v1/notifications/", { token }),

  markRead: (id: number, token?: string) =>
    fetchAPI<{ status: string }>(`/v1/notifications/${id}/mark_read/`, {
      method: "POST",
      token,
    }),

  unreadCount: (token?: string) =>
    fetchAPI<{ unread_count: number }>("/v1/notifications/unread_count/", { token }),

  markAllRead: (token?: string) =>
    fetchAPI<{ marked_as_read: number }>("/v1/notifications/mark_all_read/", {
      method: "POST",
      token,
    }),
};

export interface AuditEvent {
  id: number;
  actor: number | null;
  actor_email: string | null;
  actor_role: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  occurred_at: string;
  ip_address: string | null;
}

export const auditApi = {
  list: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: AuditEvent[]; count: number }>(
      `/v1/audit/events/${query}`,
      { token }
    );
  },
};

// ---- SLA Types & API ----

export interface SLAEvaluationCriteria {
  id: number;
  evaluation_item: number;
  item_name: string;
  item_number: number;
  service_level: string;
  criteria_text: string;
}

export interface SLAPenalty {
  id: number;
  report: number;
  penalty_type: string;
  penalty_type_display: string;
  evaluation_item: number | null;
  item_name: string | null;
  penalty_rate: string;
  penalty_amount: string | null;
  is_offset: boolean;
  notes: string;
  created_at: string;
}

export interface UptimeRecord {
  id: number;
  equipment: number;
  equipment_name: string;
  equipment_category: string;
  contract: number;
  period_start: string;
  period_end: string;
  total_operating_hours: string;
  unplanned_downtime_hours: string;
  uptime_percentage: string | null;
  downtime_reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceImprovement {
  id: number;
  contract: number;
  contract_name: string;
  title: string;
  description: string;
  proposed_by: string;
  proposed_date: string;
  is_accepted: boolean;
  accepted_date: string | null;
  effect_report: string;
  evaluation_period_start: string | null;
  evaluation_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SLARevisionRequest {
  id: number;
  contract: number;
  contract_name: string;
  requester_name: string;
  requester_department: string;
  request_date: string;
  revision_reason: string;
  document_name: string;
  section_reference: string;
  content_before: string;
  content_after: string;
  review_opinion: string;
  review_result: string;
  review_result_display: string;
  review_date: string | null;
  reviewer_name: string;
  reviewer_department: string;
  created_at: string;
  updated_at: string;
}

export interface SLACategory {
  id: number;
  name: string;
  code: string;
  weight_percent: number;
  contract: number;
  display_order: number;
  is_active: boolean;
  items: SLAEvaluationItem[];
}

export interface SLAEvaluationItem {
  id: number;
  category: number;
  item_number: number;
  name: string;
  weight: number;
  measurement_cycle: string;
  description: string;
  is_active: boolean;
  category_name: string;
  criteria: SLAEvaluationCriteria[];
}

export const slaApi = {
  // Criteria
  listCriteria: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: SLAEvaluationCriteria[] }>(`/v1/sla/criteria/${query}`, { token });
  },
  updateCriteria: (id: number, data: Partial<SLAEvaluationCriteria>, token?: string) =>
    fetchAPI<SLAEvaluationCriteria>(`/v1/sla/criteria/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  // Categories with items
  listCategories: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: SLACategory[] }>(`/v1/sla/categories/${query}`, { token });
  },

  // Penalties
  listPenalties: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: SLAPenalty[] }>(`/v1/sla/penalties/${query}`, { token });
  },

  // Uptime Records
  listUptimeRecords: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: UptimeRecord[] }>(`/v1/sla/uptime-records/${query}`, { token });
  },
  createUptimeRecord: (data: Partial<UptimeRecord>, token?: string) =>
    fetchAPI<UptimeRecord>("/v1/sla/uptime-records/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  updateUptimeRecord: (id: number, data: Partial<UptimeRecord>, token?: string) =>
    fetchAPI<UptimeRecord>(`/v1/sla/uptime-records/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
  deleteUptimeRecord: (id: number, token?: string) =>
    fetchAPI<void>(`/v1/sla/uptime-records/${id}/`, { method: "DELETE", token }),

  // Performance Improvements
  listImprovements: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: PerformanceImprovement[] }>(`/v1/sla/improvements/${query}`, { token });
  },
  createImprovement: (data: Partial<PerformanceImprovement>, token?: string) =>
    fetchAPI<PerformanceImprovement>("/v1/sla/improvements/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  updateImprovement: (id: number, data: Partial<PerformanceImprovement>, token?: string) =>
    fetchAPI<PerformanceImprovement>(`/v1/sla/improvements/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
  deleteImprovement: (id: number, token?: string) =>
    fetchAPI<void>(`/v1/sla/improvements/${id}/`, { method: "DELETE", token }),

  // Revision Requests
  listRevisionRequests: (params?: Record<string, string>, token?: string) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchAPI<{ results: SLARevisionRequest[] }>(`/v1/sla/revision-requests/${query}`, { token });
  },
  createRevisionRequest: (data: Partial<SLARevisionRequest>, token?: string) =>
    fetchAPI<SLARevisionRequest>("/v1/sla/revision-requests/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  updateRevisionRequest: (id: number, data: Partial<SLARevisionRequest>, token?: string) =>
    fetchAPI<SLARevisionRequest>(`/v1/sla/revision-requests/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
  deleteRevisionRequest: (id: number, token?: string) =>
    fetchAPI<void>(`/v1/sla/revision-requests/${id}/`, { method: "DELETE", token }),

  // Report actions
  calculateScore: (reportId: number, token?: string) =>
    fetchAPI(`/v1/sla/evaluation-reports/${reportId}/calculate_score/`, {
      method: "POST",
      token,
    }),
  getReportPenalties: (reportId: number, token?: string) =>
    fetchAPI<SLAPenalty[]>(`/v1/sla/evaluation-reports/${reportId}/penalties/`, { token }),
  getUptimeSummary: (reportId: number, token?: string) =>
    fetchAPI(`/v1/sla/evaluation-reports/${reportId}/uptime_summary/`, { token }),
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenPair> => {
    // Use Next.js API route which sets refresh token as HttpOnly cookie
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.detail || "Invalid credentials");
    }

    const data = await res.json();
    // Access token cookie is set by the API route response
    return { access: data.access };
  },

  refresh: async (): Promise<TokenPair | null> => {
    // Use Next.js API route which reads HttpOnly refresh token cookie
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    // Access token cookie is updated by the API route response
    return { access: data.access };
  },

  logout: async (): Promise<void> => {
    try {
      // Use Next.js API route which clears HttpOnly cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearTokens();
    }
  },
};
