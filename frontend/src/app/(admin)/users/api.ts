/**
 * Typed client wrapper for user/role endpoints, routed through clientFetch so
 * the 401 token-refresh flow applies. Used by the "use client" edit page and
 * the user-actions island in this directory.
 */

import { clientFetch } from "@/lib/client-fetch";

export interface UserEditData {
  id: number;
  username: string;
  email: string;
  display_name: string;
  status: string;
  is_active: boolean;
}

export interface UserRole {
  id: number;
  name: string;
  description: string;
}

interface Paginated<T> {
  results?: T[];
}

export const usersClient = {
  get: (id: string | number) =>
    clientFetch.get<UserEditData>(`/v1/users/${id}/`),
  listRoles: () =>
    clientFetch.get<Paginated<UserRole> | UserRole[]>("/v1/roles/"),
  updateRoles: (id: string | number, roleIds: number[]) =>
    clientFetch.patch(`/v1/users/${id}/roles/`, { role_ids: roleIds }),
  remove: (id: string | number) => clientFetch.del(`/v1/users/${id}/`),
};
