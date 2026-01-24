import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { contractsApi, ContractListItem } from "@/lib/api";
import SearchInput from "@/components/ui/search-input";
import FilterSelect from "@/components/ui/filter-select";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";

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

const STATUS_OPTIONS = [
  { value: "pre-handover", label: "인수 전" },
  { value: "handover", label: "인수" },
  { value: "stabilization", label: "안정화" },
  { value: "steady", label: "정상 운영" },
  { value: "closed", label: "종료" },
];

const ITEMS_PER_PAGE = 10;

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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContractsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const search = (params.search as string) || "";
  const statusFilter = (params.status as string) || "";
  const page = parseInt((params.page as string) || "1", 10);

  let allContracts: ContractListItem[] = [];
  let error: string | null = null;

  try {
    const response = await contractsApi.list(token);
    allContracts = response.results || [];
  } catch (e) {
    error = e instanceof Error ? e.message : "사업 목록을 불러오지 못했습니다";
  }

  // Client-side filtering
  let filteredContracts = allContracts;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredContracts = filteredContracts.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.client_org.toLowerCase().includes(searchLower)
    );
  }

  if (statusFilter) {
    filteredContracts = filteredContracts.filter((c) => c.status === statusFilter);
  }

  // Pagination
  const totalItems = filteredContracts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const contracts = filteredContracts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Suspense fallback={<div className="h-10 bg-gray-100 rounded-md animate-pulse" />}>
            <SearchInput placeholder="사업명, 발주처 검색..." />
          </Suspense>
        </div>
        <Suspense fallback={<div className="h-10 w-32 bg-gray-100 rounded-md animate-pulse" />}>
          <FilterSelect
            options={STATUS_OPTIONS}
            paramName="status"
            placeholder="전체 상태"
          />
        </Suspense>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <Suspense fallback={<TableSkeleton rows={5} columns={5} />}>
        <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  사업명
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  발주처
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                  리스크
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-black">
                    {search || statusFilter
                      ? "검색 결과가 없습니다"
                      : "등록된 사업이 없습니다"}
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
                    <td className="px-6 py-4 text-black">{contract.client_org}</td>
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

        <div className="md:hidden space-y-4">
          {contracts.length === 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
              {search || statusFilter
                ? "검색 결과가 없습니다"
                : "등록된 사업이 없습니다"}
            </div>
          ) : (
            contracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="font-medium text-blue-600 block"
                    >
                      {contract.name}
                    </Link>
                    <div className="text-sm text-black">{contract.client_org}</div>
                  </div>
                  <StatusBadge status={contract.status} />
                </div>

                <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">기간</span>
                    <span className="text-black">
                      {contract.start_date} ~ {contract.end_date}
                    </span>
                  </div>
                  {contract.risk_flags &&
                    (contract.risk_flags.pre_env ||
                      contract.risk_flags.prior_vendor_coordination ||
                      contract.risk_flags.docs_incomplete) && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-black">리스크</span>
                        <RiskIndicators flags={contract.risk_flags} />
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        <Suspense fallback={null}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
          />
        </Suspense>
      </Suspense>
    </div>
  );
}
