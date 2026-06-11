"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { slaApi } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

export interface UptimeFormState {
  success: boolean;
  error?: string;
}

export async function createUptimeRecord(
  formData: FormData,
): Promise<UptimeFormState> {
  const token = await getToken();
  try {
    await slaApi.createUptimeRecord(
      {
        equipment: Number(formData.get("equipment")),
        contract: Number(formData.get("contract")),
        period_start: formData.get("period_start") as string,
        period_end: formData.get("period_end") as string,
        total_operating_hours: formData.get("total_operating_hours") as string,
        unplanned_downtime_hours:
          (formData.get("unplanned_downtime_hours") as string) || "0",
        downtime_reason: (formData.get("downtime_reason") as string) || "",
        notes: (formData.get("notes") as string) || "",
      },
      token,
    );
    revalidatePath("/sla/uptime");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "저장에 실패했습니다",
    };
  }
}

export async function deleteUptimeRecord(
  id: number,
): Promise<UptimeFormState> {
  const token = await getToken();
  try {
    await slaApi.deleteUptimeRecord(id, token);
    revalidatePath("/sla/uptime");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "삭제에 실패했습니다",
    };
  }
}
