/**
 * Server-component-friendly helper for DRF paginated endpoints.
 *
 * Returns the full `{count, next, previous, results}` payload so callers can
 * render pagination controls. On error returns an empty page rather than
 * throwing, matching the existing list-page UX (renders "no items" instead of
 * crashing the page).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const DEFAULT_PAGE_SIZE = 20;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface FetchPaginatedOptions {
  token?: string;
  page?: number;
  pageSize?: number;
  query?: Record<string, string | number | boolean | undefined | null>;
  revalidate?: number | false;
}

const EMPTY_PAGE: Paginated<never> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function buildQuery(
  page: number,
  pageSize: number | undefined,
  extra: FetchPaginatedOptions["query"],
): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (pageSize && pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(pageSize));
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value === undefined || value === null || value === "") continue;
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPaginated<T>(
  path: string,
  opts: FetchPaginatedOptions = {},
): Promise<Paginated<T>> {
  const page = Math.max(1, opts.page ?? 1);
  const query = buildQuery(page, opts.pageSize, opts.query);
  const url = `${API_URL}${path}${query}`;
  const revalidate = opts.revalidate ?? 30;

  try {
    const res = await fetch(url, {
      next: revalidate === false ? undefined : { revalidate },
      cache: revalidate === false ? "no-store" : undefined,
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
    });
    if (!res.ok) return EMPTY_PAGE as Paginated<T>;
    const data = (await res.json()) as Partial<Paginated<T>>;
    return {
      count: typeof data.count === "number" ? data.count : 0,
      next: data.next ?? null,
      previous: data.previous ?? null,
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch {
    return EMPTY_PAGE as Paginated<T>;
  }
}

export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}
