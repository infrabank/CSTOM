"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

interface EventCreateInput {
  contract: number;
  record_type: string;
  title: string;
  description?: string;
  occurred_at: string;
  detected_at?: string;
  resolved_at?: string;
  customer_notified?: boolean;
  customer_notified_at?: string;
}

export async function createEvent(formData: FormData) {
  const token = await getToken();
  const data: EventCreateInput = {
    contract: parseInt(formData.get("contract") as string, 10),
    record_type: formData.get("record_type") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    occurred_at: formData.get("occurred_at") as string,
    detected_at: (formData.get("detected_at") as string) || undefined,
    resolved_at: (formData.get("resolved_at") as string) || undefined,
    customer_notified: formData.get("customer_notified") === "on",
    customer_notified_at:
      (formData.get("customer_notified_at") as string) || undefined,
  };

  try {
    const res = await fetch(`${API_URL}/events/`, {
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
        error: err?.error?.message || err?.detail || "이벤트 등록에 실패했습니다",
      };
    }

    const event = await res.json();
    revalidatePath("/events");
    return { success: true, id: event.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 등록에 실패했습니다",
    };
  }
}

export async function updateEvent(id: number, formData: FormData) {
  const token = await getToken();
  const data: Partial<EventCreateInput> = {
    contract: parseInt(formData.get("contract") as string, 10),
    record_type: formData.get("record_type") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    occurred_at: formData.get("occurred_at") as string,
    detected_at: (formData.get("detected_at") as string) || undefined,
    resolved_at: (formData.get("resolved_at") as string) || undefined,
    customer_notified: formData.get("customer_notified") === "on",
    customer_notified_at:
      (formData.get("customer_notified_at") as string) || undefined,
  };

  try {
    const res = await fetch(`${API_URL}/events/${id}/`, {
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
        error: err?.error?.message || err?.detail || "이벤트 수정에 실패했습니다",
      };
    }

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 수정에 실패했습니다",
    };
  }
}

export async function linkEvent(eventId: number, relatedEventId: number) {
  const token = await getToken();
  try {
    const res = await fetch(`${API_URL}/events/${eventId}/link/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ related_event: relatedEventId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        error: err?.error?.message || err?.detail || "이벤트 연결에 실패했습니다",
      };
    }

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이벤트 연결에 실패했습니다",
    };
  }
}
