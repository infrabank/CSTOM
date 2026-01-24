/**
 * API client for CSTOM backend.
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens, TokenPair } from "./auth";

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
  options: FetchOptions = {}
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
  list: (token?: string) => fetchAPI<{ results: ContractListItem[] }>("/contracts/", { token }),

  get: (id: number, token?: string) => fetchAPI<Contract>(`/contracts/${id}/`, { token }),

  create: (data: ContractCreateInput, token?: string) =>
    fetchAPI<Contract>("/contracts/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: number, data: Partial<ContractCreateInput>, token?: string) =>
    fetchAPI<Contract>(`/contracts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  updateStatus: (id: number, status: string, notes?: string, token?: string) =>
    fetchAPI<Contract>(`/contracts/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
      token,
    }),

  delete: (id: number, token?: string) =>
    fetchAPI<void>(`/contracts/${id}/`, {
      method: "DELETE",
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
  list: (token?: string) => fetchAPI<{ results: ReportListItem[] }>("/reports/", { token }),

  get: (id: number, token?: string) => fetchAPI<Report>(`/reports/${id}/`, { token }),
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
    fetchAPI<{ results: EquipmentListItem[] }>("/equipments/", { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Equipment>(`/equipments/${id}/`, { token }),

  create: (data: EquipmentCreateInput, token?: string) =>
    fetchAPI<Equipment>("/equipments/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  update: (id: number, data: Partial<EquipmentCreateInput>, token?: string) =>
    fetchAPI<Equipment>(`/equipments/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  delete: (id: number, token?: string) =>
    fetchAPI<void>(`/equipments/${id}/`, {
      method: "DELETE",
      token,
    }),

  checkOut: (id: number, data: EquipmentTransactionInput, token?: string) =>
    fetchAPI<EquipmentTransaction>(`/equipments/${id}/check-out/`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  checkIn: (id: number, data: EquipmentTransactionInput, token?: string) =>
    fetchAPI<EquipmentTransaction>(`/equipments/${id}/check-in/`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  transactions: (id: number, token?: string) =>
    fetchAPI<EquipmentTransaction[]>(`/equipments/${id}/transactions/`, { token }),
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
    fetchAPI<{ results: TaskListItem[] }>("/tasks/", { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Task>(`/tasks/${id}/`, { token }),

  decisions: (taskId: number, token?: string) =>
    fetchAPI<{ results: DecisionLog[] }>(`/decisions/?task=${taskId}`, { token }),

  approve: (id: number, action: "approve" | "reject", notes?: string, token?: string) =>
    fetchAPI<Task>(`/tasks/${id}/approve/`, {
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
    fetchAPI<{ results: EventListItem[] }>("/events/", { token }),

  listByContract: (contractId: number, token?: string) =>
    fetchAPI<{ results: EventListItem[] }>(`/events/?contract=${contractId}`, { token }),

  get: (id: number, token?: string) =>
    fetchAPI<Event>(`/events/${id}/`, { token }),

  link: (id: number, relatedEventId: number, token?: string) =>
    fetchAPI<Event>(`/events/${id}/link/`, {
      method: "POST",
      body: JSON.stringify({ related_event: relatedEventId }),
      token,
    }),

  unlink: (id: number, token?: string) =>
    fetchAPI<Event>(`/events/${id}/`, {
      method: "PATCH",
      body: JSON.stringify({ related_event: null }),
      token,
    }),

  delete: (id: number, token?: string) =>
    fetchAPI<void>(`/events/${id}/`, {
      method: "DELETE",
      token,
    }),
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenPair> => {
    const url = `${API_URL}/token/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error?.detail || "Invalid credentials");
    }

    const tokens: TokenPair = await res.json();
    setTokens(tokens);
    return tokens;
  },

  refresh: async (): Promise<TokenPair | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const url = `${API_URL}/token/refresh/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const tokens: TokenPair = await res.json();
    setTokens(tokens);
    return tokens;
  },

  logout: async (): Promise<void> => {
    try {
      await fetchAPI<void>("/auth/logout/", { method: "POST" });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearTokens();
    }
  },
};
