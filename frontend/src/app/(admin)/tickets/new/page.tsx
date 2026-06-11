"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ticketsClient,
  type TicketContract as Contract,
  type TicketUser as User,
} from "../api";

export default function NewTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [contractId, setContractId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch contracts and users on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contractsData, usersData] = await Promise.all([
          ticketsClient.listContracts(),
          ticketsClient.listUsers(),
        ]);
        setContracts(
          Array.isArray(contractsData) ? contractsData : contractsData.results || [],
        );
        setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const data = await ticketsClient.create({
        title,
        description,
        priority,
        status: "new",
        ...(contractId ? { contract: parseInt(contractId) } : {}),
        ...(assignedToId ? { assigned_to: parseInt(assignedToId) } : {}),
      });
      router.push(`/tickets/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "티켓 생성에 실패했습니다");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">새 티켓 생성</h1>
      </div>

       {error && (
         <div className="mb-4 p-4 bg-danger-bg border border-danger-border rounded-md">
           <p className="text-danger">{error}</p>
         </div>
       )}

       <form onSubmit={handleSubmit} className="bg-surface shadow-card rounded-lg p-6 space-y-6">
        <div>
           <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
             제목 <span className="text-danger">*</span>
           </label>
           <input
             type="text"
             id="title"
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             required
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             placeholder="티켓 제목을 입력하세요"
           />
        </div>

        <div>
           <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
             설명 <span className="text-danger">*</span>
           </label>
           <textarea
             id="description"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             required
             rows={6}
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
             placeholder="티켓 내용을 상세히 입력하세요"
           />
        </div>

        <div>
           <label htmlFor="priority" className="block text-sm font-medium text-text-secondary mb-2">
             우선순위 <span className="text-danger">*</span>
           </label>
           <select
             id="priority"
             value={priority}
             onChange={(e) => setPriority(e.target.value)}
             required
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
           >
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="critical">긴급</option>
          </select>
        </div>

        <div>
           <label htmlFor="contract" className="block text-sm font-medium text-text-secondary mb-2">
             관련 사업 (선택)
           </label>
           <select
             id="contract"
             value={contractId}
             onChange={(e) => setContractId(e.target.value)}
             className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
           >
            <option value="">선택 안함</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </select>
        </div>

        <div>
           <label htmlFor="assigned_to" className="block text-sm font-medium text-text-secondary mb-2">
             담당자 (선택)
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
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name} (${user.username})`
                  : user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "생성 중..." : "티켓 생성"}
          </button>
           <Link
             href="/tickets"
             className="px-6 py-2 border border-border rounded-md hover:bg-surface-sunken"
           >
             취소
           </Link>
        </div>
      </form>
    </div>
  );
}
