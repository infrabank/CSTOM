/**
 * Typed client wrapper for workforce endpoints, routed through clientFetch so
 * the 401 token-refresh flow applies. Used by the "use client" schedule and
 * engineer-create pages in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface WorkforceUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
}

export interface WorkforceEngineerRef {
  id: number;
  user: number;
}

export interface WorkforceEngineerOption {
  id: number;
  user: number;
  user_name: string;
}

export interface WorkforceSchedule {
  id: number;
  engineer: number;
  engineer_name: string;
  date: string;
  schedule_type: string;
  schedule_type_display: string;
  notes: string | null;
  created_at: string;
}

export interface ScheduleFilters {
  engineer?: string;
  date_from?: string;
  date_to?: string;
}

interface Paginated<T> {
  results?: T[];
}

function buildScheduleQuery(filters?: ScheduleFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.engineer) params.set("engineer", filters.engineer);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const workforceClient = {
  listUsers: () =>
    clientFetch.get<Paginated<WorkforceUser> | WorkforceUser[]>("/v1/users/"),
  listEngineers: () =>
    clientFetch.get<
      Paginated<WorkforceEngineerOption> | WorkforceEngineerOption[]
    >("/v1/workforce/engineers/"),
  createEngineer: (data: {
    user: number;
    skills: string[];
    specializations: string[];
  }) => clientFetch.post("/v1/workforce/engineers/", data),
  listSchedules: (filters?: ScheduleFilters) =>
    clientFetch.get<Paginated<WorkforceSchedule> | WorkforceSchedule[]>(
      `/v1/workforce/schedules/${buildScheduleQuery(filters)}`,
    ),
  createSchedule: (data: {
    engineer: number;
    date: string;
    schedule_type: string;
    notes: string | null;
  }) => clientFetch.post<WorkforceSchedule>("/v1/workforce/schedules/", data),
  deleteSchedule: (id: string | number) =>
    clientFetch.del(`/v1/workforce/schedules/${id}/`),
};
