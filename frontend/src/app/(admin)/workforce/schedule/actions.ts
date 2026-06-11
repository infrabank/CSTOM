"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { workforceSchedulesApi } from "./server-api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

export interface ScheduleFormState {
  success: boolean;
  error?: string;
}

export async function createSchedule(
  formData: FormData,
): Promise<ScheduleFormState> {
  const token = await getToken();
  try {
    await workforceSchedulesApi.create(
      {
        engineer: Number(formData.get("engineer")),
        date: formData.get("date") as string,
        schedule_type: formData.get("schedule_type") as string,
        notes: (formData.get("notes") as string) || null,
      },
      token,
    );
    revalidatePath("/workforce/schedule");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "일정 등록에 실패했습니다",
    };
  }
}

export async function deleteSchedule(
  id: number,
): Promise<ScheduleFormState> {
  const token = await getToken();
  try {
    await workforceSchedulesApi.remove(id, token);
    revalidatePath("/workforce/schedule");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "삭제에 실패했습니다",
    };
  }
}
