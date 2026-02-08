"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { getAccessToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Contract {
  id: number;
  name: string;
}

interface SLADefinition {
  id: number;
  contract: number;
  contract_name: string;
  service_type: string;
  priority: string;
  target_response_time_minutes: number;
  target_resolution_time_minutes: number;
  description: string;
  is_active: boolean;
}

interface PageProps {
  params: Promise<{ slaId: string }>;
}

export default function EditSLADefinitionPage({ params }: PageProps) {
  const { slaId } = use(params);
  const router = useRouter();
  const [sla, setSla] = useState<SLADefinition | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = getAccessToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [slaRes, contractsRes] = await Promise.all([
          fetch(`${API_URL}/v1/sla/definitions/${slaId}/`, { headers }),
          fetch(`${API_URL}/v1/contracts/`, { headers }),
        ]);

        if (!slaRes.ok) throw new Error("SLA 정의를 불러오지 못했습니다");
        const slaData = await slaRes.json();
        setSla(slaData);

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || contractsData || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [slaId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) throw new Error("인증 토큰이 없습니다");

      const formData = new FormData(e.currentTarget);

      const payload = {
        contract: parseInt(formData.get("contract") as string),
        service_type: formData.get("service_type") as string,
        priority: formData.get("priority") as string,
        target_response_time_minutes: parseInt(formData.get("target_response_time_minutes") as string),
        target_resolution_time_minutes: parseInt(formData.get("target_resolution_time_minutes") as string),
        description: formData.get("description") as string,
        is_active: formData.get("is_active") === "on",
      };

      const res = await fetch(`${API_URL}/v1/sla/definitions/${slaId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "SLA 정의 수정에 실패했습니다");
      }

      router.push(`/sla/${slaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SLA 정의 수정에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text">불러오는 중...</div>
      </div>
    );
  }

  if (!sla) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
          {error || "SLA 정의를 찾을 수 없습니다"}
        </div>
        <Link href="/sla" className="text-accent hover:underline">
          SLA 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/sla/${slaId}`}
          className="text-accent hover:underline text-sm"
        >
          SLA 상세로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">SLA 정의 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="contract" className="block text-sm font-medium text-text-secondary mb-2">
              관련 사업 <span className="text-danger">*</span>
            </label>
            <select
              id="contract"
              name="contract"
              defaultValue={sla.contract}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">사업을 선택하세요</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="service_type" className="block text-sm font-medium text-text-secondary mb-2">
              서비스 유형 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="service_type"
              name="service_type"
              defaultValue={sla.service_type}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="예: 장애 대응, 변경 관리, 정기 점검"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-text-secondary mb-2">
              우선순위 <span className="text-danger">*</span>
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={sla.priority}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="critical">긴급</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="target_response_time_minutes" className="block text-sm font-medium text-text-secondary mb-2">
                목표 응답 시간 (분) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                id="target_response_time_minutes"
                name="target_response_time_minutes"
                defaultValue={sla.target_response_time_minutes}
                required
                min="1"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="target_resolution_time_minutes" className="block text-sm font-medium text-text-secondary mb-2">
                목표 해결 시간 (분) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                id="target_resolution_time_minutes"
                name="target_resolution_time_minutes"
                defaultValue={sla.target_resolution_time_minutes}
                required
                min="1"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
              설명
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={sla.description}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="SLA 정의에 대한 상세 설명을 입력하세요"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              defaultChecked={sla.is_active}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-text-secondary">
              활성 상태
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
            <Link
              href={`/sla/${slaId}`}
              className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
