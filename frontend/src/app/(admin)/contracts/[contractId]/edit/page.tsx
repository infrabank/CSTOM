"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateContract } from "../../actions";
import DeleteContractButton from "../../delete-contract-button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const SCOPES = [
  { value: "ops", label: "운영" },
  { value: "build", label: "구축" },
  { value: "transition", label: "전환" },
  { value: "pm", label: "PM" },
];

interface Contract {
  id: number;
  name: string;
  client_org: string;
  start_date: string;
  end_date: string;
  contract_amount: string | null;
  status: string;
  scopes: string[];
  risk_flags: {
    pre_env: boolean;
    prior_vendor_coordination: boolean;
    docs_incomplete: boolean;
  };
}

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export default function EditContractPage({ params }: PageProps) {
  const { contractId } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      try {
        const res = await fetch(`${API_URL}/contracts/${contractId}/`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("사업 정보를 불러오지 못했습니다");
        const data = await res.json();
        setContract(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사업 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContract();
  }, [contractId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateContract(parseInt(contractId, 10), formData);

    if (result.success) {
      router.push(`/contracts/${contractId}`);
    } else {
      setError(result.error || "사업 수정에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-700">불러오는 중...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error || "사업을 찾을 수 없습니다"}
        </div>
        <Link href="/contracts" className="text-blue-600 hover:underline">
          사업 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/contracts/${contractId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          사업 상세로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">사업 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              사업명 *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={contract.name}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              발주처 *
            </label>
            <input
              type="text"
              name="client_org"
              defaultValue={contract.client_org}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                시작일 *
              </label>
              <input
                type="date"
                name="start_date"
                defaultValue={contract.start_date}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                종료일 *
              </label>
              <input
                type="date"
                name="end_date"
                defaultValue={contract.end_date}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              계약 금액
            </label>
            <input
              type="text"
              name="contract_amount"
              defaultValue={contract.contract_amount || ""}
              placeholder="예: 100,000,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              사업 범위
            </label>
            <div className="flex flex-wrap gap-4">
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="scopes"
                    value={scope.value}
                    defaultChecked={contract.scopes.includes(scope.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              리스크 플래그
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_pre_env"
                  defaultChecked={contract.risk_flags.pre_env}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">인수 전 환경</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_prior_vendor"
                  defaultChecked={contract.risk_flags.prior_vendor_coordination}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">전 사업자 협업 필요</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_docs_incomplete"
                  defaultChecked={contract.risk_flags.docs_incomplete}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">문서 불완전</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
            <Link
              href={`/contracts/${contractId}`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
            <div className="ml-auto">
              <DeleteContractButton
                contractId={parseInt(contractId, 10)}
                contractName={contract.name}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
