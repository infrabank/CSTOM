/**
 * API client for CSTOM backend.
 */

import { getAccessToken, getRefreshToken, setTokens, clearTokens, TokenPair } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface LoginCredentials {
  username: string;
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
    throw new Error(error?.error?.message || error?.detail || `API error: ${res.status}`);
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

  logout: (): void => {
    clearTokens();
  },
};
