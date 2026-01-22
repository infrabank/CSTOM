"use server";

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface TaskCreateInput {
  contract: number;
  task_type: string;
  impact_level: string;
  title: string;
  description?: string;
}

export async function createTask(formData: FormData) {
  const data: TaskCreateInput = {
    contract: parseInt(formData.get("contract") as string, 10),
    task_type: formData.get("task_type") as string,
    impact_level: formData.get("impact_level") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
  };

  try {
    const res = await fetch(`${API_URL}/tasks/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || "작업 등록에 실패했습니다",
      };
    }

    const task = await res.json();
    revalidatePath("/tasks");
    return { success: true, id: task.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "작업 등록에 실패했습니다",
    };
  }
}

export async function updateTask(id: number, formData: FormData) {
  const data: Partial<TaskCreateInput> = {
    contract: parseInt(formData.get("contract") as string, 10),
    task_type: formData.get("task_type") as string,
    impact_level: formData.get("impact_level") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
  };

  try {
    const res = await fetch(`${API_URL}/tasks/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || "작업 수정에 실패했습니다",
      };
    }

    revalidatePath("/tasks");
    revalidatePath(`/tasks/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "작업 수정에 실패했습니다",
    };
  }
}
