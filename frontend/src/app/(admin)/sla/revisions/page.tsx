"use client";

import { useState, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { slaApi, contractsApi, type SLARevisionRequest, type ContractListItem } from "@/lib/api";

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const RESULT_STYLES: Record<string, string> = {
  approved: "bg-success-bg text-success",
  needs_review: "bg-warning-bg text-warning",
  rejected: "bg-danger-bg text-danger",
  "": "bg-surface-sunken text-text-muted",
};

const RESULT_LABELS: Record<string, string> = {
  approved: "개정",
  needs_review: "추가검토",
  rejected: "의견반려",
  "": "대기",
};

export default function RevisionsPage() {
  const [items, setItems] = useState<SLARevisionRequest[]>([]);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState({ review_opinion: "", review_result: "", reviewer_name: "", reviewer_department: "" });

  const [formData, setFormData] = useState({
    contract: "",
    requester_name: "",
    requester_department: "",
    request_date: "",
    revision_reason: "",
    document_name: "",
    section_reference: "",
    content_before: "",
    content_after: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revRes, contractRes] = await Promise.all([
        slaApi.listRevisionRequests({ page_size: "100" }),
        contractsApi.list(),
      ]);
      setItems(revRes.results || []);
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
      await slaApi.createRevisionRequest({
        contract: Number(formData.contract) as unknown as number,
        requester_name: formData.requester_name,
        requester_department: formData.requester_department,
        request_date: formData.request_date,
        revision_reason: formData.revision_reason,
        document_name: formData.document_name,
        section_reference: formData.section_reference,
        content_before: formData.content_before,
        content_after: formData.content_after,
      } as Partial<SLARevisionRequest>);
      setShowForm(false);
      setFormData({ contract: "", requester_name: "", requester_department: "", request_date: "", revision_reason: "", document_name: "", section_reference: "", content_before: "", content_after: "" });
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  };

  const handleReview = async (id: number) => {
    try {
      await slaApi.updateRevisionRequest(id, {
        review_opinion: reviewData.review_opinion,
        review_result: reviewData.review_result,
        reviewer_name: reviewData.reviewer_name,
        reviewer_department: reviewData.reviewer_department,
        review_date: new Date().toISOString().split("T")[0],
      });
      setReviewingId(null);
      setReviewData({ review_opinion: "", review_result: "", reviewer_name: "", reviewer_department: "" });
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "검토 처리에 실패했습니다");
    }
  };

  return (
    <div>
      <Breadcrumb />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">SLA 개정요청</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          {showForm ? "취소" : "개정요청 등록"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md border border-danger-border">{error}</div>
      )}

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
              <label className="block text-sm font-medium text-text mb-1">요청일</label>
              <input type="date" value={formData.request_date} onChange={(e) => setFormData({ ...formData, request_date: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">요청자</label>
              <input type="text" value={formData.requester_name} onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">소속</label>
              <input type="text" value={formData.requester_department} onChange={(e) => setFormData({ ...formData, requester_department: e.target.value })} required
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">문서명</label>
              <input type="text" value={formData.document_name} onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">해당조항</label>
              <input type="text" value={formData.section_reference} onChange={(e) => setFormData({ ...formData, section_reference: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-1">개정사유</label>
              <textarea value={formData.revision_reason} onChange={(e) => setFormData({ ...formData, revision_reason: e.target.value })} required rows={2}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">개정 전 내용</label>
              <textarea value={formData.content_before} onChange={(e) => setFormData({ ...formData, content_before: e.target.value })} required rows={3}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">개정 후 내용</label>
              <textarea value={formData.content_after} onChange={(e) => setFormData({ ...formData, content_after: e.target.value })} required rows={3}
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
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-surface p-8 rounded-lg shadow-card text-center text-text-muted border border-border-light">
              등록된 SLA 개정요청이 없습니다
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-surface rounded-lg shadow-card border border-border-light">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-text">{item.revision_reason}</div>
                      <div className="text-sm text-text-muted mt-1">
                        {item.requester_name} ({item.requester_department}) / {formatDate(item.request_date)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${RESULT_STYLES[item.review_result] || RESULT_STYLES[""]}`}>
                      {RESULT_LABELS[item.review_result] || RESULT_LABELS[""]}
                    </span>
                  </div>

                  {(item.document_name || item.section_reference) && (
                    <div className="text-xs text-text-muted">
                      {item.document_name && <span>문서: {item.document_name}</span>}
                      {item.section_reference && <span className="ml-2">조항: {item.section_reference}</span>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-danger-bg rounded-md p-3">
                      <div className="text-xs font-medium text-danger mb-1">개정 전</div>
                      <div className="text-sm text-text whitespace-pre-wrap">{item.content_before}</div>
                    </div>
                    <div className="bg-success-bg rounded-md p-3">
                      <div className="text-xs font-medium text-success mb-1">개정 후</div>
                      <div className="text-sm text-text whitespace-pre-wrap">{item.content_after}</div>
                    </div>
                  </div>

                  {item.review_opinion && (
                    <div className="bg-surface-sunken rounded-md p-3">
                      <div className="text-xs font-medium text-text-muted mb-1">검토의견</div>
                      <div className="text-sm text-text">{item.review_opinion}</div>
                      <div className="text-xs text-text-muted mt-1">
                        {item.reviewer_name} ({item.reviewer_department}) / {item.review_date && formatDate(item.review_date)}
                      </div>
                    </div>
                  )}

                  {/* Review form */}
                  {!item.review_result && reviewingId !== item.id && (
                    <button
                      onClick={() => setReviewingId(item.id)}
                      className="text-sm text-accent hover:underline cursor-pointer"
                    >
                      검토하기
                    </button>
                  )}

                  {reviewingId === item.id && (
                    <div className="border-t border-border-light pt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-text mb-1">검토자</label>
                          <input type="text" value={reviewData.reviewer_name} onChange={(e) => setReviewData({ ...reviewData, reviewer_name: e.target.value })}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text mb-1">검토자 소속</label>
                          <input type="text" value={reviewData.reviewer_department} onChange={(e) => setReviewData({ ...reviewData, reviewer_department: e.target.value })}
                            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">검토의견</label>
                        <textarea value={reviewData.review_opinion} onChange={(e) => setReviewData({ ...reviewData, review_opinion: e.target.value })} rows={2}
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text mb-1">검토결과</label>
                        <select value={reviewData.review_result} onChange={(e) => setReviewData({ ...reviewData, review_result: e.target.value })} required
                          className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text">
                          <option value="">선택</option>
                          <option value="approved">개정</option>
                          <option value="needs_review">추가검토</option>
                          <option value="rejected">의견반려</option>
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setReviewingId(null)} className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-surface-hover cursor-pointer">취소</button>
                        <button onClick={() => handleReview(item.id)} className="px-3 py-1.5 bg-accent text-text-on-accent rounded-md text-sm hover:bg-accent-hover cursor-pointer">저장</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
