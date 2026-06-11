/**
 * Typed client wrapper for KB endpoints, routed through clientFetch so the
 * 401 token-refresh flow applies. Used by the "use client" detail/new/edit
 * pages in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface KBArticleDetail {
  id: number;
  title: string;
  content: string;
  category: number | null;
  category_name: string;
  author_name: string;
  tags: string;
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface KBCategory {
  id: number;
  name: string;
}

export interface KBTemplate {
  id: number;
  name: string;
  incident_type: string;
  incident_type_display: string;
  template_content: string;
}

export interface KBArticleInput {
  title: string;
  content: string;
  category: number | null;
  tags: string;
  is_published: boolean;
}

interface Paginated<T> {
  results?: T[];
}

export const kbClient = {
  getArticle: (id: string | number) =>
    clientFetch.get<KBArticleDetail>(`/v1/kb/articles/${id}/`),
  listCategories: () =>
    clientFetch.get<Paginated<KBCategory>>("/v1/kb/categories/"),
  listTemplates: () =>
    clientFetch.get<Paginated<KBTemplate>>("/v1/kb/templates/"),
  createArticle: (data: KBArticleInput) =>
    clientFetch.post<KBArticleDetail>("/v1/kb/articles/", data),
  updateArticle: (id: string | number, data: KBArticleInput) =>
    clientFetch.put<KBArticleDetail>(`/v1/kb/articles/${id}/`, data),
  deleteArticle: (id: string | number) =>
    clientFetch.del(`/v1/kb/articles/${id}/`),
  incrementViews: (id: string | number) =>
    clientFetch.post(`/v1/kb/articles/${id}/increment_views/`),
  markHelpful: (id: string | number) =>
    clientFetch.post(`/v1/kb/articles/${id}/mark_helpful/`),
};
