"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/modal";
import DecisionLogForm from "@/components/decision-log-form";
import { DecisionLog } from "@/lib/api";

const ACTOR_LABELS: Record<string, string> = {
  pm: "PM",
  engineer: "엔지니어",
  joint: "공동 결정",
};

interface TaskDecisionSectionProps {
  taskId: number;
  decisions: DecisionLog[];
}

export default function TaskDecisionSection({
  taskId,
  decisions,
}: TaskDecisionSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">판단 기록</h2>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          판단 추가
        </button>
      </div>

      {decisions.length === 0 ? (
        <p className="text-black text-center py-8">기록된 판단이 없습니다</p>
      ) : (
        <div className="space-y-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">
                  {ACTOR_LABELS[decision.actor_role] || decision.actor_role}
                </span>
                <span className="text-sm text-black">
                  {new Date(decision.created_at).toLocaleString("ko-KR")}
                </span>
              </div>

              {decision.rationale_notes && (
                <p className="text-black mb-3">{decision.rationale_notes}</p>
              )}

              <div className="flex gap-4 text-sm">
                <span
                  className={
                    decision.alternatives_considered
                      ? "text-green-600"
                      : "text-black"
                  }
                >
                  {decision.alternatives_considered ? "O" : "X"} 대안 검토
                </span>
                <span
                  className={
                    decision.risk_acknowledged ? "text-green-600" : "text-black"
                  }
                >
                  {decision.risk_acknowledged ? "O" : "X"} 리스크 인지
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="판단 추가">
        <DecisionLogForm
          taskId={taskId}
          onSuccess={handleSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
