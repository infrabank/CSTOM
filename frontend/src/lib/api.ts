/**
 * API client for CSTOM backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error: ${res.status}`);
  }

  return res.json();
}

export const contractsApi = {
  list: () => fetchAPI<{ results: ContractListItem[] }>("/contracts/"),

  get: (id: number) => fetchAPI<Contract>(`/contracts/${id}/`),

  create: (data: ContractCreateInput) =>
    fetchAPI<Contract>("/contracts/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ContractCreateInput>) =>
    fetchAPI<Contract>(`/contracts/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string, notes?: string) =>
    fetchAPI<Contract>(`/contracts/${id}/status/`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    }),
};
