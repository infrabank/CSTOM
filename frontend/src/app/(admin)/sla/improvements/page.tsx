"use client";

import { useState, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { slaApi, contractsApi, type PerformanceImprovement, type ContractListItem } from "@/lib/api";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function ImprovementsPage() {
  const [items, setItems] = useState<PerformanceImprovement[]>([]);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    contract: "",
    title: "",
    description: "",
    proposed_by: "",
    proposed_date: "",
    evaluation_period_start: "",
    evaluation_period_end: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [impRes, contractRes] = await Promise.all([
        slaApi.listImprovements({ page_size: "100" }),
        contractsApi.list(),
      ]);
      setItems(impRes.results || []);
      setContracts(contractRes.results || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await slaApi.createImprovement({
        contract: Number(formData.contract) as unknown as number,
        title: formData.title,
        description: formData.description,
        proposed_by: formData.proposed_by,
        proposed_date: formData.proposed_date,
        evaluation_period_start: formData.evaluation_period_start || null,
        evaluation_period_end: formData.evaluation_period_end || null,
      } as Partial<PerformanceImprovement>);
      setShowForm(false);
      setFormData({ contract: "", title: "", description: "", proposed_by: "", proposed_date: "", evaluation_period_start: "", evaluation_period_end: "" });
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await slaApi.updateImprovement(id, {
        is_accepted: true,
        accepted_date: new Date().toISOString().split("T")[0],
      });
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 처리에 실패했습니다");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await slaApi.deleteImprovement(id);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
    }
  };

  const acceptedCount = items.filter((i) => i.is_accepted).length;

  return (
    <div>
      <Breadcrumb />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">성능개선 제안</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "개선안 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">총 제안</div>
          <div className="text-xl font-semibold text-text mt-1">{items.length}건</div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">승인됨</div>
          <div className="text-xl font-semibold text-success mt-1">{acceptedCount}건</div>
        </div>
        <div className="bg-surface shadow-card rounded-lg p-4 border border-border-light">
          <div className="text-sm text-text-muted">SLA 가점</div>
          <div className="text-xl font-semibold text-accent mt-1">+{acceptedCount}점</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface shadow-card rounded-lg p-6 border border-border-light mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">사업</label>
              <select value={formData.contract} onChange={(e) => setFormData({ ...formData, contract: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text">
                <option value="">선택</option>
                {contracts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">제안자</label>
              <input type="text" value={formData.proposed_by} onChange={(e) => setFormData({ ...formData, proposed_by: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">제목</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">내용</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">제안일</label>
              <input type="date" value={formData.proposed_date} onChange={(e) => setFormData({ ...formData, proposed_date: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">평가기간 시작</label>
              <input type="date" value={formData.evaluation_period_start} onChange={(e) => setFormData({ ...formData, evaluation_period_start: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium">
              저장
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-text-muted text-center py-8">로딩중...</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">사업</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">제안자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">제안일</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">등록된 성능개선 제안이 없습니다</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-sunken">
                      <td className="px-4 py-3 text-sm text-text font-medium">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{item.contract_name}</td>
                      <td className="px-4 py-3 text-sm text-text">{item.proposed_by || "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{formatDate(item.proposed_date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.is_accepted ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                        }`}>
                          {item.is_accepted ? "승인" : "제안"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center space-x-2">
                        {!item.is_accepted && (
                          <button onClick={() => handleAccept(item.id)} className="text-accent hover:underline text-xs cursor-pointer">승인</button>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="text-danger hover:underline text-xs cursor-pointer">삭제</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {items.length === 0 ? (
              <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text-muted">
                등록된 성능개선 제안이 없습니다
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-surface rounded-lg shadow-card p-4 space-y-2 border border-border-light">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-text text-sm">{item.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_accepted ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                    }`}>
                      {item.is_accepted ? "승인" : "제안"}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted">{item.contract_name} / {item.proposed_by || "-"}</div>
                  <div className="text-xs text-text-secondary">{item.description.substring(0, 100)}{item.description.length > 100 ? "..." : ""}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">{formatDate(item.proposed_date)}</span>
                    <div className="space-x-2">
                      {!item.is_accepted && (
                        <button onClick={() => handleAccept(item.id)} className="text-accent cursor-pointer">승인</button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="text-danger cursor-pointer">삭제</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
