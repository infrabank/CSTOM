"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ticketsClient,
  type TicketContract as Contract,
  type TicketUser as User,
} from "../../api";
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from "@/lib/labels";

const PRIORITY_OPTIONS = TICKET_PRIORITY_OPTIONS;
const STATUS_OPTIONS = TICKET_STATUS_OPTIONS;

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
        const [ticket, contractsData, usersData] = await Promise.all([
          ticketsClient.get(ticketId),
          ticketsClient.listContracts(),
          ticketsClient.listUsers(),
        ]);

        setTitle(ticket.title);
        setDescription(ticket.description);
        setPriority(ticket.priority);
        setStatus(ticket.status);
        setContractId(ticket.contract ? String(ticket.contract) : "");
        setAssignedToId(ticket.assigned_to ? String(ticket.assigned_to) : "");

        setContracts(
          Array.isArray(contractsData) ? contractsData : contractsData.results || [],
        );
        setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
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
      await ticketsClient.update(ticketId, {
        title,
        description,
        priority,
        status,
        contract: contractId ? parseInt(contractId) : null,
        assigned_to: assignedToId ? parseInt(assignedToId) : null,
      });
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
