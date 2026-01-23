import Link from "next/link";
import { cookies } from "next/headers";
import { equipmentsApi, EquipmentListItem } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  server: "Server",
  network: "Network",
  storage: "Storage",
  security: "Security",
  pc: "PC",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  checked_out: "Checked Out",
  maintenance: "Maintenance",
  retired: "Retired",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  checked_out: "bg-red-100 text-red-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-black",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-black";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default async function EquipmentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let equipments: EquipmentListItem[] = [];
  let error: string | null = null;

  try {
    const response = await equipmentsApi.list(token);
    equipments = response.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load equipment list";
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment Management</h1>
        <Link
          href="/equipments/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Register Equipment
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Equipment Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Contract
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                Last Transaction
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  No registered equipment
                </td>
              </tr>
            ) : (
              equipments.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/equipments/${equipment.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {equipment.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black font-mono text-sm">
                    {equipment.serial_number}
                  </td>
                  <td className="px-6 py-4 text-black">
                    {CATEGORY_LABELS[equipment.category] || equipment.category}
                  </td>
                  <td className="px-6 py-4 text-black">
                    <Link
                      href={`/contracts/${equipment.contract}`}
                      className="hover:underline"
                    >
                      {equipment.contract_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={equipment.status} />
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {equipment.last_transaction ? (
                      <div>
                        <span className={equipment.last_transaction.type === "check_out" ? "text-red-600" : "text-green-600"}>
                          {equipment.last_transaction.type_display}
                        </span>
                        <span className="text-black ml-2">
                          by {equipment.last_transaction.handler_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-black">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
