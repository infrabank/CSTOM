/**
 * Typed client wrapper for inspection endpoints, routed through clientFetch so
 * the 401 token-refresh flow applies. Used by the "use client" schedule and
 * task detail/new pages in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface InspectionContract {
  id: number;
  name: string;
}

export interface InspectionUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface InspectionScheduleDetail {
  id: number;
  equipment_type: string;
  contract: number;
  contract_name: string;
  cycle: string;
  assigned_to: number | null;
  assigned_to_name: string;
  description: string;
  is_active: boolean;
  task_count: number;
  created_at: string;
  updated_at: string;
}

export interface InspectionScheduleOption {
  id: number;
  equipment_type: string;
  contract_name: string;
}

export interface InspectionTaskRow {
  id: number;
  schedule: number;
  scheduled_date: string;
  status: string;
  notes: string;
  completed_at: string | null;
}

export interface InspectionTaskResult {
  id: number;
  result: string;
  notes: string;
  completed_by_name: string;
  completed_at: string;
}

export interface InspectionTaskDetail {
  id: number;
  schedule: number;
  schedule_equipment: string;
  scheduled_date: string;
  assigned_to: number | null;
  assigned_to_name: string;
  status: string;
  notes: string;
  results: InspectionTaskResult[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleInput {
  contract: number;
  equipment_type: string;
  cycle: string;
  assigned_to: number | null;
  description: string;
  is_active: boolean;
}

export interface TaskInput {
  schedule: number;
  scheduled_date: string;
  assigned_to: number | null;
  status: string;
  notes: string;
}

interface Paginated<T> {
  results?: T[];
}

export const inspectionsClient = {
  listContracts: () =>
    clientFetch.get<Paginated<InspectionContract> | InspectionContract[]>(
      "/v1/contracts/",
    ),
  listUsers: () =>
    clientFetch.get<Paginated<InspectionUser> | InspectionUser[]>("/v1/users/"),
  // Schedules
  getSchedule: (id: string | number) =>
    clientFetch.get<InspectionScheduleDetail>(
      `/v1/inspections/schedules/${id}/`,
    ),
  listActiveSchedules: () =>
    clientFetch.get<
      Paginated<InspectionScheduleOption> | InspectionScheduleOption[]
    >("/v1/inspections/schedules/?is_active=true"),
  createSchedule: (data: ScheduleInput) =>
    clientFetch.post<InspectionScheduleDetail>(
      "/v1/inspections/schedules/",
      data,
    ),
  updateSchedule: (id: string | number, data: ScheduleInput) =>
    clientFetch.patch<InspectionScheduleDetail>(
      `/v1/inspections/schedules/${id}/`,
      data,
    ),
  deleteSchedule: (id: string | number) =>
    clientFetch.del(`/v1/inspections/schedules/${id}/`),
  // Tasks
  getTask: (id: string | number) =>
    clientFetch.get<InspectionTaskDetail>(`/v1/inspections/tasks/${id}/`),
  listTasksBySchedule: (scheduleId: string | number) =>
    clientFetch.get<Paginated<InspectionTaskRow> | InspectionTaskRow[]>(
      `/v1/inspections/tasks/?schedule=${scheduleId}`,
    ),
  createTask: (data: TaskInput) =>
    clientFetch.post<InspectionTaskDetail>("/v1/inspections/tasks/", data),
  updateTask: (id: string | number, data: TaskInput) =>
    clientFetch.patch<InspectionTaskDetail>(
      `/v1/inspections/tasks/${id}/`,
      data,
    ),
  deleteTask: (id: string | number) =>
    clientFetch.del(`/v1/inspections/tasks/${id}/`),
  completeTask: (
    id: string | number,
    data: { result: string; notes: string },
  ) => clientFetch.post(`/v1/inspections/tasks/${id}/complete/`, data),
};
