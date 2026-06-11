"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { slaApi } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

export interface ImprovementFormState {
  success: boolean;
  error?: string;
}

export async function createImprovement(
  formData: FormData,
): Promise<ImprovementFormState> {
  const token = await getToken();
  try {
    await slaApi.createImprovement(
      {
        contract: Number(formData.get("contract")),
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        proposed_by: (formData.get("proposed_by") as string) || "",
        proposed_date: formData.get("proposed_date") as string,
        evaluation_period_start:
          (formData.get("evaluation_period_start") as string) || null,
        evaluation_period_end:
          (formData.get("evaluation_period_end") as string) || null,
      },
      token,
    );
    revalidatePath("/sla/improvements");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "저장에 실패했습니다",
    };
  }
}

export async function acceptImprovement(
  id: number,
): Promise<ImprovementFormState> {
  const token = await getToken();
  try {
    await slaApi.updateImprovement(
      id,
      {
        is_accepted: true,
        accepted_date: new Date().toISOString().split("T")[0],
      },
      token,
    );
    revalidatePath("/sla/improvements");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "승인 처리에 실패했습니다",
    };
  }
}

export async function deleteImprovement(
  id: number,
): Promise<ImprovementFormState> {
  const token = await getToken();
  try {
    await slaApi.deleteImprovement(id, token);
    revalidatePath("/sla/improvements");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "삭제에 실패했습니다",
    };
  }
}
