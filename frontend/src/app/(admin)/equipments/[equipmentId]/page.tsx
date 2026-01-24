"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { equipmentsApi, Equipment, EquipmentTransaction } from "@/lib/api";
import Modal from "@/components/modal";

const CATEGORY_LABELS: Record<string, string> = {
  server: "서버",
  network: "네트워크 장비",
  storage: "스토리지",
  security: "보안 장비",
  pc: "PC/워크스테이션",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  available: "보관중",
  checked_out: "반출중",
  maintenance: "점검중",
  retired: "폐기",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  checked_out: "bg-red-100 text-red-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-black",
};

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = Number(params.equipmentId);

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [transactions, setTransactions] = useState<EquipmentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [equipmentData, transactionsData] = await Promise.all([
          equipmentsApi.get(equipmentId),
          equipmentsApi.transactions(equipmentId),
        ]);
        setEquipment(equipmentData);
        setTransactions(transactionsData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "장비 정보를 불러오지 못했습니다");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [equipmentId]);

  async function handleCheckOut(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      const expectedReturnDate = formData.get("expected_return_date") as string;
      await equipmentsApi.checkOut(equipmentId, {
        handler_name: formData.get("handler_name") as string,
        handler_affiliation: formData.get("handler_affiliation") as string,
        handler_contact: formData.get("handler_contact") as string,
        rationale: formData.get("rationale") as string,
        expected_return_date: expectedReturnDate && expectedReturnDate.trim() ? expectedReturnDate : undefined,
        notes: formData.get("notes") as string,
      });
      setShowCheckOutModal(false);
      router.refresh();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "반출 처리에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckIn(formData: FormData) {
    setIsSubmitting(true);
    setError(null);
    try {
      await equipmentsApi.checkIn(equipmentId, {
        handler_name: formData.get("handler_name") as string,
        handler_affiliation: formData.get("handler_affiliation") as string,
        handler_contact: formData.get("handler_contact") as string,
        rationale: formData.get("rationale") as string,
        notes: formData.get("notes") as string,
      });
      setShowCheckInModal(false);
      router.refresh();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "반입 처리에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-black">불러오는 중...</div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error || "장비를 찾을 수 없습니다"}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/equipments" className="text-blue-600 hover:underline">
          &larr; 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            <p className="text-black font-mono">{equipment.serial_number}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[equipment.status] || "bg-gray-100 text-black"
              }`}
            >
              {STATUS_LABELS[equipment.status] || equipment.status}
            </span>
            <Link
              href={`/equipments/${equipmentId}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              수정
            </Link>
            {equipment.status === "available" && (
              <button
                onClick={() => setShowCheckOutModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                반출
              </button>
            )}
            {equipment.status === "checked_out" && (
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                반입
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-black mb-1">사업</h3>
            <Link href={`/contracts/${equipment.contract}`} className="text-blue-600 hover:underline">
              {equipment.contract_name}
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">분류</h3>
            <p>{CATEGORY_LABELS[equipment.category] || equipment.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">모델명</h3>
            <p>{equipment.model_name || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">제조사</h3>
            <p>{equipment.manufacturer || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">보관 위치</h3>
            <p>{equipment.location || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">등록일</h3>
            <p>{new Date(equipment.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </div>

        {equipment.notes && (
          <div>
            <h3 className="text-sm font-medium text-black mb-1">비고</h3>
            <p className="text-black whitespace-pre-wrap">{equipment.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">반출입 이력</h2>

        {transactions.length === 0 ? (
          <p className="text-black text-center py-8">반출입 이력이 없습니다</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`border rounded-lg p-4 ${
                  tx.transaction_type === "check_out"
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`font-medium ${
                      tx.transaction_type === "check_out" ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {tx.transaction_type_display}
                  </span>
                  <span className="text-sm text-black">
                    {new Date(tx.transaction_date).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="text-black">
                  <p>
                    <span className="font-medium">담당자:</span> {tx.handler_name}
                    {tx.handler_affiliation && ` (${tx.handler_affiliation})`}
                  </p>
                  {tx.handler_contact && (
                    <p>
                      <span className="font-medium">연락처:</span> {tx.handler_contact}
                    </p>
                  )}
                  {tx.purpose && (
                    <p>
                      <span className="font-medium">목적:</span> {tx.purpose}
                    </p>
                  )}
                  {tx.expected_return_date && (
                    <p>
                      <span className="font-medium">반납예정일:</span> {tx.expected_return_date}
                    </p>
                  )}
                  {tx.notes && (
                    <p>
                      <span className="font-medium">비고:</span> {tx.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCheckOutModal}
        onClose={() => setShowCheckOutModal(false)}
        title="장비 반출"
      >
        <form action={handleCheckOut} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">담당자명 *</label>
            <input
              type="text"
              name="handler_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">소속</label>
            <input
              type="text"
              name="handler_affiliation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">연락처</label>
            <input
              type="text"
              name="handler_contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">반출 사유 *</label>
            <textarea
              name="rationale"
              rows={2}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">반납 예정일</label>
            <input
              type="date"
              name="expected_return_date"
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">비고</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowCheckOutModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "반출"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        title="장비 반입"
      >
        <form action={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">담당자명 *</label>
            <input
              type="text"
              name="handler_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">소속</label>
            <input
              type="text"
              name="handler_affiliation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">연락처</label>
            <input
              type="text"
              name="handler_contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">반입 사유 *</label>
            <textarea
              name="rationale"
              rows={2}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">비고</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowCheckInModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "처리 중..." : "반입"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
