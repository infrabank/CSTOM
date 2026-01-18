"use server";

/**
 * Server actions for report operations.
 */

import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ReportGenerateInput {
  contract: number;
  report_type: string;
  period_start: string;
  period_end: string;
}

export async function generateReport(formData: FormData) {
  const data: ReportGenerateInput = {
    contract: parseInt(formData.get("contract") as string, 10),
    report_type: formData.get("report_type") as string,
    period_start: formData.get("period_start") as string,
    period_end: formData.get("period_end") as string,
  };

  try {
    const res = await fetch(`${API_URL}/reports/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || "Failed to generate report",
      };
    }

    const report = await res.json();
    revalidatePath("/reports");
    return { success: true, id: report.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate report",
    };
  }
}
