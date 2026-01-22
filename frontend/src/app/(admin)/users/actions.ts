"use server";

/**
 * Server actions for user operations.
 */

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface UserCreateInput {
  username: string;
  email: string;
  display_name?: string;
  password?: string;
  status?: string;
  is_active?: boolean;
}

export async function createUser(formData: FormData) {
  const data: UserCreateInput = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    display_name: (formData.get("display_name") as string) || undefined,
    password: (formData.get("password") as string) || undefined,
    status: (formData.get("status") as string) || "active",
    is_active: formData.get("is_active") === "on",
  };

  try {
    const res = await fetch(`${API_URL}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || "사용자 등록에 실패했습니다",
      };
    }

    const user = await res.json();
    revalidatePath("/users");
    return { success: true, id: user.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "사용자 등록에 실패했습니다",
    };
  }
}

export async function updateUser(id: number, formData: FormData) {
  const data: Partial<UserCreateInput> = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    display_name: (formData.get("display_name") as string) || undefined,
    status: (formData.get("status") as string) || "active",
    is_active: formData.get("is_active") === "on",
  };

  // Only include password if provided
  const password = formData.get("password") as string;
  if (password) {
    data.password = password;
  }

  try {
    const res = await fetch(`${API_URL}/users/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || "사용자 수정에 실패했습니다",
      };
    }

    revalidatePath("/users");
    revalidatePath(`/users/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "사용자 수정에 실패했습니다",
    };
  }
}
