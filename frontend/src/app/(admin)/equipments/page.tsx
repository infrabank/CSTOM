import Link from "next/link";
import { cookies } from "next/headers";
import { equipmentsApi, EquipmentListItem } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  server: "서버",
  network: "네트워크",
  storage: "스토리지",
  security: "보안장비",
  pc: "PC",
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
    error = e instanceof Error ? e.message : "장비 목록을 불러오지 못했습니다";
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">장비 반출입 관리</h1>
        <Link
          href="/equipments/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          장비 등록
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                장비명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                시리얼번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                분류
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                사업
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                최근 이력
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-black">
                  등록된 장비가 없습니다
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

      <div className="md:hidden space-y-4">
        {equipments.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 장비가 없습니다
          </div>
        ) : (
          equipments.map((equipment) => (
            <div key={equipment.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Link
                    href={`/equipments/${equipment.id}`}
                    className="font-medium text-blue-600 block"
                  >
                    {equipment.name}
                  </Link>
                  <div className="text-sm text-black font-mono">
                    {equipment.serial_number}
                  </div>
                </div>
                <StatusBadge status={equipment.status} />
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">분류</span>
                  <span className="text-black">
                    {CATEGORY_LABELS[equipment.category] || equipment.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">사업</span>
                  <Link
                    href={`/contracts/${equipment.contract}`}
                    className="text-black underline"
                  >
                    {equipment.contract_name}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">최근 이력</span>
                  <div className="text-right">
                    {equipment.last_transaction ? (
                      <>
                        <span
                          className={
                            equipment.last_transaction.type === "check_out"
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {equipment.last_transaction.type_display}
                        </span>
                        <span className="text-black ml-1">
                          by {equipment.last_transaction.handler_name}
                        </span>
                      </>
                    ) : (
                      <span className="text-black">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
