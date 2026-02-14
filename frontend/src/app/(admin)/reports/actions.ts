"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

interface ReportGenerateInput {
  contract: number;
  report_type: string;
  period_start: string;
  period_end: string;
}

export async function generateReport(formData: FormData) {
  const token = await getToken();
  const data: ReportGenerateInput = {
    contract: parseInt(formData.get("contract") as string, 10),
    report_type: formData.get("report_type") as string,
    period_start: formData.get("period_start") as string,
    period_end: formData.get("period_end") as string,
  };

  try {
    const res = await fetch(`${API_URL}/v1/reports/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || err?.detail || "보고서 생성에 실패했습니다",
      };
    }

    const report = await res.json();
    revalidatePath("/reports");
    return { success: true, id: report.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "보고서 생성에 실패했습니다",
    };
  }
}

export async function updateReport(id: number, formData: FormData) {
  const token = await getToken();
  const data: Partial<ReportGenerateInput> = {
    contract: parseInt(formData.get("contract") as string, 10),
    report_type: formData.get("report_type") as string,
    period_start: formData.get("period_start") as string,
    period_end: formData.get("period_end") as string,
  };

  try {
    const res = await fetch(`${API_URL}/v1/reports/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || err?.detail || "보고서 수정에 실패했습니다",
      };
    }

    revalidatePath("/reports");
    revalidatePath(`/reports/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "보고서 수정에 실패했습니다",
    };
  }
}
