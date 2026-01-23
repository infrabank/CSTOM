"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { equipmentsApi, contractsApi, ContractListItem } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "server", label: "서버" },
  { value: "network", label: "네트워크 장비" },
  { value: "storage", label: "스토리지" },
  { value: "security", label: "보안 장비" },
  { value: "pc", label: "PC/워크스테이션" },
  { value: "other", label: "기타" },
];

export default function NewEquipmentPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const response = await contractsApi.list();
        setContracts(response.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사업 목록을 불러오지 못했습니다");
      }
    };
    loadContracts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await equipmentsApi.create({
        contract: Number(formData.get("contract")),
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        serial_number: formData.get("serial_number") as string,
        model_name: formData.get("model_name") as string,
        manufacturer: formData.get("manufacturer") as string,
        location: formData.get("location") as string,
        notes: formData.get("notes") as string,
      });
      router.push("/equipments");
    } catch (e) {
      setError(e instanceof Error ? e.message : "장비 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">장비 등록</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              사업 *
            </label>
            <select
              name="contract"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">사업 선택</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              장비명 *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                분류 *
              </label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                시리얼번호 *
              </label>
              <input
                type="text"
                name="serial_number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                모델명
              </label>
              <input
                type="text"
                name="model_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                제조사
              </label>
              <input
                type="text"
                name="manufacturer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              보관 위치
            </label>
            <input
              type="text"
              name="location"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비고
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <Link
              href="/equipments"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
