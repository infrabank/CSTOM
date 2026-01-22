"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { contractsApi, ContractCreateInput } from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("cstom_access_token")?.value;
}

function parseAmount(value: string | null): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value.replace(/,/g, "");
}

export async function createContract(formData: FormData) {
  const token = await getToken();
  const data: ContractCreateInput = {
    name: formData.get("name") as string,
    client_org: formData.get("client_org") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    contract_amount: parseAmount(formData.get("contract_amount") as string),
    scope_list: formData.getAll("scopes") as string[],
    risk_pre_env: formData.get("risk_pre_env") === "on",
    risk_prior_vendor: formData.get("risk_prior_vendor") === "on",
    risk_docs_incomplete: formData.get("risk_docs_incomplete") === "on",
  };

  try {
    const contract = await contractsApi.create(data, token);
    revalidatePath("/contracts");
    return { success: true, id: contract.id };
  } catch (error) {
    console.error("Contract create error:", error);
    console.error("Data sent:", JSON.stringify(data, null, 2));
    console.error("Token present:", !!token);
    return {
      success: false,
      error: error instanceof Error ? error.message : "사업 등록에 실패했습니다",
    };
  }
}

export async function updateContract(id: number, formData: FormData) {
  const token = await getToken();
  const data: Partial<ContractCreateInput> = {
    name: formData.get("name") as string,
    client_org: formData.get("client_org") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    contract_amount: parseAmount(formData.get("contract_amount") as string),
    scope_list: formData.getAll("scopes") as string[],
    risk_pre_env: formData.get("risk_pre_env") === "on",
    risk_prior_vendor: formData.get("risk_prior_vendor") === "on",
    risk_docs_incomplete: formData.get("risk_docs_incomplete") === "on",
  };

  try {
    await contractsApi.update(id, data, token);
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "사업 수정에 실패했습니다",
    };
  }
}

export async function updateContractStatus(
  id: number,
  status: string,
  notes?: string
) {
  const token = await getToken();
  try {
    await contractsApi.updateStatus(id, status, notes, token);
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "상태 변경에 실패했습니다",
    };
  }
}

export async function deleteContract(id: number) {
  const token = await getToken();
  try {
    await contractsApi.delete(id, token);
    revalidatePath("/contracts");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "사업 삭제에 실패했습니다",
    };
  }
}
