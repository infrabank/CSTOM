"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAccessToken } from "@/lib/auth";

interface Contract {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  display_name: string;
}

interface TicketDetail {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: number | null;
  contract: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const PRIORITY_OPTIONS = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
  { value: "critical", label: "긴급" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "신규" },
  { value: "open", label: "접수" },
  { value: "in_progress", label: "처리중" },
  { value: "waiting", label: "대기" },
  { value: "resolved", label: "해결" },
  { value: "closed", label: "종료" },
];

export default function EditTicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("new");
  const [contractId, setContractId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAccessToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" };

        // Fetch ticket, contracts, users in parallel
        const [ticketRes, contractsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/v1/tickets/${ticketId}/`, { headers }),
          fetch(`${API_URL}/v1/contracts/`, { headers }),
          fetch(`${API_URL}/v1/users/`, { headers }),
        ]);

        if (!ticketRes.ok) {
          throw new Error("티켓을 불러올 수 없습니다");
        }

        const ticket: TicketDetail = await ticketRes.json();
        setTitle(ticket.title);
        setDescription(ticket.description);
        setPriority(ticket.priority);
        setStatus(ticket.status);
        setContractId(ticket.contract ? String(ticket.contract) : "");
        setAssignedToId(ticket.assigned_to ? String(ticket.assigned_to) : "");

        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          setContracts(contractsData.results || contractsData || []);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.results || usersData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      const payload: Record<string, unknown> = {
        title,
        description,
        priority,
        status,
      };

      payload.contract = contractId ? parseInt(contractId) : null;
      payload.assigned_to = assignedToId ? parseInt(assignedToId) : null;

      const res = await fetch(`${API_URL}/v1/tickets/${ticketId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errData = await res.json();
          const errMsg =
            errData.detail ||
            Object.values(errData).flat().join(", ") ||
            "수정에 실패했습니다";
          throw new Error(errMsg);
        }
        throw new Error(`수정에 실패했습니다 (HTTP ${res.status})`);
      }

      router.push(`/tickets/${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/tickets/${ticketId}`}
          className="text-accent hover:underline text-sm"
        >
          티켓 상세로
        </Link>
        <h1 className="text-2xl font-bold mt-2">티켓 수정</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
          <p className="text-danger">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface shadow-card rounded-lg p-6 space-y-6 border border-border-light"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            제목 <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            설명 <span className="text-danger">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Priority & Status row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              우선순위 <span className="text-danger">*</span>
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              상태 <span className="text-danger">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contract */}
        <div>
          <label
            htmlFor="contract"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            관련 사업
          </label>
          <select
            id="contract"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">선택 안함</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned To */}
        <div>
          <label
            htmlFor="assigned_to"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            담당자
          </label>
          <select
            id="assigned_to"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">선택 안함</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name || user.username}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
          <Link
            href={`/tickets/${ticketId}`}
            className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken text-text-secondary text-sm"
          >
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}
