"use client";

import { useState, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { slaApi, equipmentsApi, contractsApi, type UptimeRecord, type EquipmentListItem, type ContractListItem } from "@/lib/api";

function formatPercent(value: string | null): string {
  if (!value) return "-";
  return Number(value).toFixed(2) + "%";
}

function uptimeColor(value: string | null): string {
  if (!value) return "text-text-muted";
  const n = Number(value);
  if (n >= 99.5) return "text-success";
  if (n >= 99.0) return "text-warning";
  return "text-danger";
}

export default function UptimePage() {
  const [records, setRecords] = useState<UptimeRecord[]>([]);
  const [equipments, setEquipments] = useState<EquipmentListItem[]>([]);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    equipment: "",
    contract: "",
    period_start: "",
    period_end: "",
    total_operating_hours: "",
    unplanned_downtime_hours: "0",
    downtime_reason: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uptimeRes, eqRes, contractRes] = await Promise.all([
        slaApi.listUptimeRecords({ page_size: "200" }),
        equipmentsApi.list(),
        contractsApi.list(),
      ]);
      setRecords(uptimeRes.results || []);
      setEquipments(eqRes.results || []);
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
      await slaApi.createUptimeRecord({
        equipment: Number(formData.equipment) as unknown as number,
        contract: Number(formData.contract) as unknown as number,
        period_start: formData.period_start,
        period_end: formData.period_end,
        total_operating_hours: formData.total_operating_hours,
        unplanned_downtime_hours: formData.unplanned_downtime_hours || "0",
        downtime_reason: formData.downtime_reason,
        notes: formData.notes,
      } as Partial<UptimeRecord>);
      setShowForm(false);
      setFormData({
        equipment: "", contract: "", period_start: "", period_end: "",
        total_operating_hours: "", unplanned_downtime_hours: "0",
        downtime_reason: "", notes: "",
      });
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      await slaApi.deleteUptimeRecord(id);
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
    }
  };

  // Group by category for summary
  const categoryMap: Record<string, { total: number; count: number }> = {};
  records.forEach((r) => {
    const cat = r.equipment_category || "other";
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    if (r.uptime_percentage) {
      categoryMap[cat].total += Number(r.uptime_percentage);
      categoryMap[cat].count += 1;
    }
  });

  const CATEGORY_LABELS: Record<string, string> = {
    server: "서버", network: "네트워크", storage: "스토리지",
    security: "보안장비", pc: "PC", other: "기타",
  };

  return (
    <div>
      <Breadcrumb />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">가동율 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "가동율 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

      {/* Category summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {Object.entries(categoryMap).map(([cat, data]) => {
          const avg = data.count > 0 ? (data.total / data.count).toFixed(2) : "-";
          return (
            <div key={cat} className="bg-surface shadow-card rounded-lg p-3 border border-border-light text-center">
              <div className="text-xs text-text-muted">{CATEGORY_LABELS[cat] || cat}</div>
              <div className={`text-lg font-semibold mt-1 ${uptimeColor(data.count > 0 ? String(data.total / data.count) : null)}`}>
                {avg}{data.count > 0 ? "%" : ""}
              </div>
            </div>
          );
        })}
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
              <label className="block text-sm font-medium text-text mb-1">장비</label>
              <select value={formData.equipment} onChange={(e) => setFormData({ ...formData, equipment: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text">
                <option value="">선택</option>
                {equipments.map((eq) => <option key={eq.id} value={eq.id}>{eq.name} ({eq.category_display})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">기간 시작</label>
              <input type="date" value={formData.period_start} onChange={(e) => setFormData({ ...formData, period_start: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">기간 종료</label>
              <input type="date" value={formData.period_end} onChange={(e) => setFormData({ ...formData, period_end: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">총 운영시간</label>
              <input type="number" step="0.01" value={formData.total_operating_hours} onChange={(e) => setFormData({ ...formData, total_operating_hours: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">비계획 중단시간</label>
              <input type="number" step="0.01" value={formData.unplanned_downtime_hours} onChange={(e) => setFormData({ ...formData, unplanned_downtime_hours: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">중단 사유</label>
            <input type="text" value={formData.downtime_reason} onChange={(e) => setFormData({ ...formData, downtime_reason: e.target.value })}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium">
              저장
            </button>
          </div>
        </form>
      )}

      {/* Records table */}
      {loading ? (
        <div className="text-text-muted text-center py-8">로딩중...</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
            <table className="min-w-full divide-y divide-border-light">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">장비</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">분류</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">기간</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">운영시간</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">중단시간</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">가동율</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">사유</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-text-muted uppercase">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {records.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-text-muted">등록된 가동율 기록이 없습니다</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-sunken">
                      <td className="px-4 py-3 text-sm text-text">{r.equipment_name}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{CATEGORY_LABELS[r.equipment_category] || r.equipment_category}</td>
                      <td className="px-4 py-3 text-sm text-text-muted">{r.period_start} ~ {r.period_end}</td>
                      <td className="px-4 py-3 text-sm text-text text-right">{r.total_operating_hours}h</td>
                      <td className="px-4 py-3 text-sm text-text text-right">{r.unplanned_downtime_hours}h</td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${uptimeColor(r.uptime_percentage)}`}>
                        {formatPercent(r.uptime_percentage)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{r.downtime_reason || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(r.id)} className="text-danger hover:underline text-xs cursor-pointer">삭제</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {records.length === 0 ? (
              <div className="bg-surface p-4 rounded-lg shadow-card text-center text-text-muted">
                등록된 가동율 기록이 없습니다
              </div>
            ) : (
              records.map((r) => (
                <div key={r.id} className="bg-surface rounded-lg shadow-card p-4 space-y-2 border border-border-light">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-text text-sm">{r.equipment_name}</span>
                      <span className="ml-2 text-xs text-text-muted">{CATEGORY_LABELS[r.equipment_category] || r.equipment_category}</span>
                    </div>
                    <span className={`text-sm font-semibold ${uptimeColor(r.uptime_percentage)}`}>
                      {formatPercent(r.uptime_percentage)}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted">{r.period_start} ~ {r.period_end}</div>
                  <div className="flex justify-between text-xs">
                    <span>운영 {r.total_operating_hours}h / 중단 {r.unplanned_downtime_hours}h</span>
                    <button onClick={() => handleDelete(r.id)} className="text-danger cursor-pointer">삭제</button>
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
