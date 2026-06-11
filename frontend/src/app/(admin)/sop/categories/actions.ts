"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sopCategoriesApi } from "./server-api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

export interface CategoryFormState {
  success: boolean;
  error?: string;
}

export async function createCategory(
  formData: FormData,
): Promise<CategoryFormState> {
  const token = await getToken();
  const parentRaw = formData.get("parent") as string;
  try {
    await sopCategoriesApi.create(
      {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || "",
        parent: parentRaw ? Number(parentRaw) : null,
      },
      token,
    );
    revalidatePath("/sop/categories");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "등록에 실패했습니다",
    };
  }
}

export async function deleteCategory(
  id: number,
): Promise<CategoryFormState> {
  const token = await getToken();
  try {
    await sopCategoriesApi.remove(id, token);
    revalidatePath("/sop/categories");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "삭제에 실패했습니다",
    };
  }
}
