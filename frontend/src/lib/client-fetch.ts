/**
 * Client-side fetch helper that mirrors the 401 token-refresh-and-retry flow
 * built into `fetchAPI` in @/lib/api, for use in "use client" pages that talk
 * to the backend directly. Domain wrappers in each (admin) feature directory
 * build typed methods on top of this.
 *
 * On a 401 it triggers a single shared `authApi.refresh()` (which updates the
 * access-token cookie), then retries once. If refresh fails the user is sent
 * to /login, matching the api.ts behaviour.
 */

import { authApi } from "./api";
import { getAccessToken, type TokenPair } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

let refreshPromise: Promise<TokenPair | null> | null = null;

export interface ClientFetchOptions extends RequestInit {
  /** Skip JSON content-type header (e.g. for DELETE with no body). */
  skipJsonHeader?: boolean;
}

async function request<T>(
  endpoint: string,
  options: ClientFetchOptions = {},
  isRetry = false,
): Promise<T> {
  const { skipJsonHeader, ...fetchOptions } = options;
  const token = getAccessToken();

  const headers: Record<string, string> = {};
  if (!skipJsonHeader) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: { ...headers, ...fetchOptions.headers },
  });

  if (res.status === 401 && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = authApi.refresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;
    if (refreshed) {
      return request<T>(endpoint, options, true);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("세션이 만료되었습니다. 다시 로그인해주세요.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const message =
      error?.error?.message ||
      error?.detail ||
      (error && typeof error === "object"
        ? Object.values(error).flat().join(", ")
        : "") ||
      `요청에 실패했습니다 (HTTP ${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json();
}

export const clientFetch = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  del: <T = void>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE", skipJsonHeader: true }),
};
