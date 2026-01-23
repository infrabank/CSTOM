import Link from "next/link";
import { cookies } from "next/headers";
import { contractsApi, ContractListItem } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  "pre-handover": "인수 전",
  handover: "인수",
  stabilization: "안정화",
  steady: "정상 운영",
  closed: "종료",
};

const STATUS_COLORS: Record<string, string> = {
  "pre-handover": "bg-yellow-100 text-yellow-800",
  handover: "bg-blue-100 text-blue-800",
  stabilization: "bg-purple-100 text-purple-800",
  steady: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-black",
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

function RiskIndicators({
  flags,
}: {
  flags?: ContractListItem["risk_flags"];
}) {
  if (!flags) return null;
  
  const risks = [];
  if (flags.pre_env) risks.push("환경");
  if (flags.prior_vendor_coordination) risks.push("협업");
  if (flags.docs_incomplete) risks.push("문서");

  if (risks.length === 0) return null;

  return (
    <div className="flex gap-1">
      {risks.map((risk) => (
        <span
          key={risk}
          className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded"
        >
          {risk}
        </span>
      ))}
    </div>
  );
}

export default async function ContractsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  let contracts: ContractListItem[] = [];
  let error: string | null = null;

  try {
    const response = await contractsApi.list(token);
    contracts = response.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "사업 목록을 불러오지 못했습니다";
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">사업 관리</h1>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          사업 등록
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
                사업명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                발주처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                리스크
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-black">
                  등록된 사업이 없습니다
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {contract.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black">
                    {contract.client_org}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {contract.start_date} ~ {contract.end_date}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="px-6 py-4">
                    <RiskIndicators flags={contract.risk_flags} />
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
