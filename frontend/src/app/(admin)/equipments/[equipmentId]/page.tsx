"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { equipmentsApi, Equipment, EquipmentTransaction } from "@/lib/api";
import Modal from "@/components/modal";

const CATEGORY_LABELS: Record<string, string> = {
  server: "Server",
  network: "Network Device",
  storage: "Storage",
  security: "Security Device",
  pc: "PC/Workstation",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  checked_out: "Checked Out",
  maintenance: "Under Maintenance",
  retired: "Retired",
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
        setError(e instanceof Error ? e.message : "Failed to load equipment");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [equipmentId]);

  async function handleCheckOut(formData: FormData) {
    setIsSubmitting(true);
    try {
      await equipmentsApi.checkOut(equipmentId, {
        handler_name: formData.get("handler_name") as string,
        handler_affiliation: formData.get("handler_affiliation") as string,
        handler_contact: formData.get("handler_contact") as string,
        purpose: formData.get("purpose") as string,
        expected_return_date: formData.get("expected_return_date") as string || undefined,
        notes: formData.get("notes") as string,
      });
      setShowCheckOutModal(false);
      router.refresh();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-out failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckIn(formData: FormData) {
    setIsSubmitting(true);
    try {
      await equipmentsApi.checkIn(equipmentId, {
        handler_name: formData.get("handler_name") as string,
        handler_affiliation: formData.get("handler_affiliation") as string,
        handler_contact: formData.get("handler_contact") as string,
        notes: formData.get("notes") as string,
      });
      setShowCheckInModal(false);
      router.refresh();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-black">Loading...</div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">{error || "Equipment not found"}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/equipments" className="text-blue-600 hover:underline">
          &larr; Back to List
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
            {equipment.status === "available" && (
              <button
                onClick={() => setShowCheckOutModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Check Out
              </button>
            )}
            {equipment.status === "checked_out" && (
              <button
                onClick={() => setShowCheckInModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Check In
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Contract</h3>
            <Link href={`/contracts/${equipment.contract}`} className="text-blue-600 hover:underline">
              {equipment.contract_name}
            </Link>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Category</h3>
            <p>{CATEGORY_LABELS[equipment.category] || equipment.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Model</h3>
            <p>{equipment.model_name || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Manufacturer</h3>
            <p>{equipment.manufacturer || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Storage Location</h3>
            <p>{equipment.location || "-"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Registered</h3>
            <p>{new Date(equipment.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </div>

        {equipment.notes && (
          <div>
            <h3 className="text-sm font-medium text-black mb-1">Notes</h3>
            <p className="text-black whitespace-pre-wrap">{equipment.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-black text-center py-8">No transactions recorded</p>
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
                    <span className="font-medium">Handler:</span> {tx.handler_name}
                    {tx.handler_affiliation && ` (${tx.handler_affiliation})`}
                  </p>
                  {tx.handler_contact && (
                    <p>
                      <span className="font-medium">Contact:</span> {tx.handler_contact}
                    </p>
                  )}
                  {tx.purpose && (
                    <p>
                      <span className="font-medium">Purpose:</span> {tx.purpose}
                    </p>
                  )}
                  {tx.expected_return_date && (
                    <p>
                      <span className="font-medium">Expected Return:</span> {tx.expected_return_date}
                    </p>
                  )}
                  {tx.notes && (
                    <p>
                      <span className="font-medium">Notes:</span> {tx.notes}
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
        title="Equipment Check-Out"
      >
        <form action={handleCheckOut} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Handler Name *</label>
            <input
              type="text"
              name="handler_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Affiliation</label>
            <input
              type="text"
              name="handler_affiliation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Contact</label>
            <input
              type="text"
              name="handler_contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Purpose</label>
            <textarea
              name="purpose"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Expected Return Date</label>
            <input
              type="date"
              name="expected_return_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Notes</label>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Check Out"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        title="Equipment Check-In"
      >
        <form action={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Handler Name *</label>
            <input
              type="text"
              name="handler_name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Affiliation</label>
            <input
              type="text"
              name="handler_affiliation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Contact</label>
            <input
              type="text"
              name="handler_contact"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Notes</label>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Check In"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
