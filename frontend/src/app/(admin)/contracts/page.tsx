import Link from "next/link";
import { cookies } from "next/headers";
import { contractsApi, ContractListItem } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  "pre-handover": "bg-yellow-100 text-yellow-800",
  handover: "bg-blue-100 text-blue-800",
  stabilization: "bg-purple-100 text-purple-800",
  steady: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status.replace("-", " ")}
    </span>
  );
}

function RiskIndicators({
  flags,
}: {
  flags: ContractListItem["risk_flags"];
}) {
  const risks = [];
  if (flags.pre_env) risks.push("ENV");
  if (flags.prior_vendor_coordination) risks.push("VENDOR");
  if (flags.docs_incomplete) risks.push("DOCS");

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
    error = e instanceof Error ? e.message : "Failed to load contracts";
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contracts</h1>
        <Link
          href="/contracts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Contract
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Risks
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No contracts found
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
                  <td className="px-6 py-4 text-gray-600">
                    {contract.client_org}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {contract.start_date} - {contract.end_date}
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
