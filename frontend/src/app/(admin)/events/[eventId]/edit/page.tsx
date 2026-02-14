"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { getAccessToken } from "@/lib/auth";
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
  severity: number | null;
}

const RECORD_TYPES = [
  { value: "change", label: "변경" },
  { value: "incident", label: "장애" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "1", label: "심각도 1 (서비스 전면중단)" },
  { value: "2", label: "심각도 2 (주요기능 장애)" },
  { value: "3", label: "심각도 3 (경미한 장애)" },
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
        const token = getAccessToken();
        const headers: HeadersInit = {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const [eventRes, contractsRes] = await Promise.all([
          fetch(`${API_URL}/v1/events/${eventId}/`, { cache: "no-store", headers }),
          fetch(`${API_URL}/v1/contracts/`, { cache: "no-store", headers }),
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
        <div className="text-center text-text">불러오는 중...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error || "이벤트를 찾을 수 없습니다"}
        </div>
         <Link href="/events" className="text-accent hover:underline">
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
           className="text-accent hover:underline text-sm"
         >
          이벤트 상세로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">이벤트 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-text mb-1">
               사업 *
             </label>
             <select
               name="contract"
               required
               defaultValue={event.contract}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
             <label className="block text-sm font-medium text-text mb-1">
               유형 *
             </label>
             <select
               name="record_type"
               required
               defaultValue={event.record_type}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             >
              {RECORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {event.record_type === "incident" && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                심각도
              </label>
              <select
                name="severity"
                defaultValue={event.severity?.toString() || ""}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {SEVERITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-secondary">
                SLA 평가 시 심각도별 가중치 적용: 심각도1=1.0건, 심각도2=0.5건, 심각도3=제외
              </p>
            </div>
          )}

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               제목 *
             </label>
             <input
               type="text"
               name="title"
               required
               defaultValue={event.title}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               상세 내용
             </label>
             <textarea
               name="description"
               rows={4}
               defaultValue={event.description}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 발생 시각 *
               </label>
               <input
                 type="datetime-local"
                 name="occurred_at"
                 required
                 defaultValue={formatDatetimeLocal(event.occurred_at)}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-text mb-1">
                 인지 시각
               </label>
               <input
                 type="datetime-local"
                 name="detected_at"
                 defaultValue={formatDatetimeLocal(event.detected_at)}
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               해결 시각
             </label>
             <input
               type="datetime-local"
               name="resolved_at"
               defaultValue={formatDatetimeLocal(event.resolved_at)}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

           <div className="space-y-2">
             <label className="flex items-center gap-2">
               <input
                 type="checkbox"
                 name="customer_notified"
                 defaultChecked={event.customer_notified}
                 className="rounded border-border text-accent focus:ring-accent"
               />
               <span className="text-sm">고객 통보 완료</span>
             </label>
           </div>

           <div>
             <label className="block text-sm font-medium text-text mb-1">
               고객 통보 시각
             </label>
             <input
               type="datetime-local"
               name="customer_notified_at"
               defaultValue={formatDatetimeLocal(event.customer_notified_at)}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             />
           </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
             <Link
               href={`/events/${eventId}`}
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken"
             >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
