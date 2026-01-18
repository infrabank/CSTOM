"use server";

/**
 * Server actions for contract operations.
 */

import { revalidatePath } from "next/cache";
import { contractsApi, ContractCreateInput } from "@/lib/api";

export async function createContract(formData: FormData) {
  const data: ContractCreateInput = {
    name: formData.get("name") as string,
    client_org: formData.get("client_org") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    contract_amount: (formData.get("contract_amount") as string) || undefined,
    scope_list: formData.getAll("scopes") as string[],
    risk_pre_env: formData.get("risk_pre_env") === "on",
    risk_prior_vendor: formData.get("risk_prior_vendor") === "on",
    risk_docs_incomplete: formData.get("risk_docs_incomplete") === "on",
  };

  try {
    const contract = await contractsApi.create(data);
    revalidatePath("/contracts");
    return { success: true, id: contract.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create contract",
    };
  }
}

export async function updateContract(id: number, formData: FormData) {
  const data: Partial<ContractCreateInput> = {
    name: formData.get("name") as string,
    client_org: formData.get("client_org") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    contract_amount: (formData.get("contract_amount") as string) || undefined,
    scope_list: formData.getAll("scopes") as string[],
    risk_pre_env: formData.get("risk_pre_env") === "on",
    risk_prior_vendor: formData.get("risk_prior_vendor") === "on",
    risk_docs_incomplete: formData.get("risk_docs_incomplete") === "on",
  };

  try {
    await contractsApi.update(id, data);
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update contract",
    };
  }
}

export async function updateContractStatus(
  id: number,
  status: string,
  notes?: string
) {
  try {
    await contractsApi.updateStatus(id, status, notes);
    revalidatePath("/contracts");
    revalidatePath(`/contracts/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}
