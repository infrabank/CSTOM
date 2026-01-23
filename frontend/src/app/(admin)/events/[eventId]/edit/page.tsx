"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { updateEvent } from "../../actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
}

interface Event {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  description: string;
  occurred_at: string;
  detected_at: string | null;
  resolved_at: string | null;
  customer_notified: boolean;
  customer_notified_at: string | null;
}

const RECORD_TYPES = [
  { value: "change", label: "변경" },
  { value: "incident", label: "장애" },
];

function formatDatetimeLocal(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toISOString().slice(0, 16);
}

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EditEventPage({ params }: PageProps) {
  const { eventId } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, contractsRes] = await Promise.all([
          fetch(`${API_URL}/events/${eventId}/`, { cache: "no-store" }),
          fetch(`${API_URL}/contracts/`, { cache: "no-store" }),
        ]);

        if (!eventRes.ok) throw new Error("이벤트 정보를 불러오지 못했습니다");
        const eventData = await eventRes.json();
        setEvent(eventData);

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "이벤트 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await updateEvent(parseInt(eventId, 10), formData);

    if (result.success) {
      router.push(`/events/${eventId}`);
    } else {
      setError(result.error || "이벤트 수정에 실패했습니다");
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

  if (!event) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error || "이벤트를 찾을 수 없습니다"}
        </div>
        <Link href="/events" className="text-blue-600 hover:underline">
          이벤트 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/events/${eventId}`}
          className="text-blue-600 hover:underline text-sm"
        >
          이벤트 상세로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">이벤트 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              사업 *
            </label>
            <select
              name="contract"
              required
              defaultValue={event.contract}
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
            <label className="block text-sm font-medium text-gray-800 mb-1">
              유형 *
            </label>
            <select
              name="record_type"
              required
              defaultValue={event.record_type}
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
            <label className="block text-sm font-medium text-gray-800 mb-1">
              제목 *
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={event.title}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              상세 내용
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={event.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                발생 시각 *
              </label>
              <input
                type="datetime-local"
                name="occurred_at"
                required
                defaultValue={formatDatetimeLocal(event.occurred_at)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                인지 시각
              </label>
              <input
                type="datetime-local"
                name="detected_at"
                defaultValue={formatDatetimeLocal(event.detected_at)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              해결 시각
            </label>
            <input
              type="datetime-local"
              name="resolved_at"
              defaultValue={formatDatetimeLocal(event.resolved_at)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="customer_notified"
                defaultChecked={event.customer_notified}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">고객 통보 완료</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              고객 통보 시각
            </label>
            <input
              type="datetime-local"
              name="customer_notified_at"
              defaultValue={formatDatetimeLocal(event.customer_notified_at)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              href={`/events/${eventId}`}
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
