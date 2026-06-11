/**
 * Typed client wrapper for ticket endpoints, routed through clientFetch so the
 * 401 token-refresh flow applies. Used by the "use client" detail/new/edit
 * pages in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface TicketComment {
  id: number;
  content: string;
  is_internal: boolean;
  created_by_name: string;
  created_at: string;
}

export interface TicketDetail {
  id: number;
  title: string;
  description: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  requester_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  contract: number | null;
  comments: TicketComment[];
  created_at: string;
  updated_at: string;
}

export interface TicketContract {
  id: number;
  name: string;
}

export interface TicketUser {
  id: number;
  username: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority: string;
  status: string;
  contract?: number | null;
  assigned_to?: number | null;
}

interface Paginated<T> {
  results?: T[];
}

export const ticketsClient = {
  get: (id: string | number) =>
    clientFetch.get<TicketDetail>(`/v1/tickets/${id}/`),
  listContracts: () =>
    clientFetch.get<Paginated<TicketContract> | TicketContract[]>(
      "/v1/contracts/",
    ),
  listUsers: () =>
    clientFetch.get<Paginated<TicketUser> | TicketUser[]>("/v1/users/"),
  create: (data: TicketInput) =>
    clientFetch.post<TicketDetail>("/v1/tickets/", data),
  update: (id: string | number, data: TicketInput) =>
    clientFetch.patch<TicketDetail>(`/v1/tickets/${id}/`, data),
  addComment: (
    id: string | number,
    data: { content: string; is_internal: boolean },
  ) => clientFetch.post(`/v1/tickets/${id}/add_comment/`, data),
};
