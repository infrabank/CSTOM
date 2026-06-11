"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { slaApi, type SLARevisionRequest } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

export interface RevisionFormState {
  success: boolean;
  error?: string;
}

export async function createRevisionRequest(
  formData: FormData,
): Promise<RevisionFormState> {
  const token = await getToken();
  try {
    await slaApi.createRevisionRequest(
      {
        contract: Number(formData.get("contract")),
        requester_name: formData.get("requester_name") as string,
        requester_department: formData.get("requester_department") as string,
        request_date: formData.get("request_date") as string,
        revision_reason: formData.get("revision_reason") as string,
        document_name: (formData.get("document_name") as string) || "",
        section_reference: (formData.get("section_reference") as string) || "",
        content_before: formData.get("content_before") as string,
        content_after: formData.get("content_after") as string,
      } as Partial<SLARevisionRequest>,
      token,
    );
    revalidatePath("/sla/revisions");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "저장에 실패했습니다",
    };
  }
}

export async function reviewRevisionRequest(
  id: number,
  formData: FormData,
): Promise<RevisionFormState> {
  const token = await getToken();
  try {
    await slaApi.updateRevisionRequest(
      id,
      {
        review_opinion: (formData.get("review_opinion") as string) || "",
        review_result: formData.get("review_result") as string,
        reviewer_name: (formData.get("reviewer_name") as string) || "",
        reviewer_department: (formData.get("reviewer_department") as string) || "",
        review_date: new Date().toISOString().split("T")[0],
      },
      token,
    );
    revalidatePath("/sla/revisions");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "검토 처리에 실패했습니다",
    };
  }
}
