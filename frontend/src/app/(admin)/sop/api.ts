/**
 * Typed client wrapper for SOP endpoints, routed through clientFetch so the
 * 401 token-refresh flow applies. Used by the "use client" detail/new/edit
 * and category pages in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface SOPCategory {
  id: number;
  name: string;
  description?: string;
  parent?: number | null;
  created_at?: string;
}

export interface SOPVersion {
  id: number;
  version_number: number;
  created_by_name: string;
  created_at: string;
}

export interface SOPCurrentVersion extends SOPVersion {
  content: string;
}

export interface SOPDocumentDetail {
  id: number;
  title: string;
  category: number;
  category_name: string;
  author_name: string;
  current_version: SOPCurrentVersion | null;
  versions?: SOPVersion[];
  created_at: string;
  updated_at: string;
}

interface Paginated<T> {
  results?: T[];
}

export const sopClient = {
  getDocument: (id: string | number) =>
    clientFetch.get<SOPDocumentDetail>(`/v1/sop/documents/${id}/`),
  listCategories: () =>
    clientFetch.get<Paginated<SOPCategory> | SOPCategory[]>(
      "/v1/sop/categories/",
    ),
  createCategory: (data: {
    name: string;
    description: string;
    parent: number | null;
  }) => clientFetch.post<SOPCategory>("/v1/sop/categories/", data),
  deleteCategory: (id: string | number) =>
    clientFetch.del(`/v1/sop/categories/${id}/`),
  createDocument: (data: { title: string; category: number | null }) =>
    clientFetch.post<SOPDocumentDetail>("/v1/sop/documents/", data),
  updateDocument: (
    id: string | number,
    data: { title: string; category: number },
  ) => clientFetch.put<SOPDocumentDetail>(`/v1/sop/documents/${id}/`, data),
  createVersion: (id: string | number, content: string) =>
    clientFetch.post(`/v1/sop/documents/${id}/create_version/`, { content }),
  createVersionRecord: (data: {
    document: number;
    version_number: number;
    content: string;
    created_by: string;
  }) => clientFetch.post("/v1/sop/versions/", data),
};
