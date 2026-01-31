"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
}

const RECORD_TYPES = [
  { value: "change", label: "변경" },
  { value: "incident", label: "장애" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch(`${API_URL}/v1/contracts/`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setContracts(data.results || []);
        }
      } catch {
      }
    }
    fetchContracts();
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createEvent(formData);

    if (result.success) {
      router.push(`/events/${result.id}`);
    } else {
      setError(result.error || "이벤트 등록에 실패했습니다");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/events" className="text-blue-600 hover:underline text-sm">
          이벤트 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">이벤트 등록</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="contract" className="block text-sm font-medium text-black mb-1">
              사업 *
            </label>
            <select
              id="contract"
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
            <label htmlFor="record_type" className="block text-sm font-medium text-black mb-1">
              유형 *
            </label>
            <select
              id="record_type"
              name="record_type"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {RECORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
              상세 내용
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="occurred_at" className="block text-sm font-medium text-black mb-1">
                발생 시각 *
              </label>
              <input
                id="occurred_at"
                type="datetime-local"
                name="occurred_at"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="detected_at" className="block text-sm font-medium text-black mb-1">
                인지 시각
              </label>
              <input
                id="detected_at"
                type="datetime-local"
                name="detected_at"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="resolved_at" className="block text-sm font-medium text-black mb-1">
              해결 시각
            </label>
            <input
              id="resolved_at"
              type="datetime-local"
              name="resolved_at"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                id="customer_notified"
                type="checkbox"
                name="customer_notified"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">고객 통보 완료</span>
            </label>
          </div>

          <div>
            <label htmlFor="customer_notified_at" className="block text-sm font-medium text-black mb-1">
              고객 통보 시각
            </label>
            <input
              id="customer_notified_at"
              type="datetime-local"
              name="customer_notified_at"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
            <Link
              href="/events"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
