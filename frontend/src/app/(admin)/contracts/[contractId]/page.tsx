import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { contractsApi, Contract } from "@/lib/api";
import DeleteContractButton from "../delete-contract-button";

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
  closed: "bg-gray-100 text-gray-800",
};

const SCOPE_LABELS: Record<string, string> = {
  operation: "운영",
  construction: "구축",
  transition: "전환",
  pm: "PM",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function RiskCard({
  title,
  isRisk,
  description,
}: {
  title: string;
  isRisk: boolean;
  description: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        isRisk ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={isRisk ? "text-red-600" : "text-green-600"}>
          {isRisk ? "!" : "OK"}
        </span>
        <h4 className="font-medium">{title}</h4>
      </div>
      <p className="text-sm text-gray-800">{description}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ contractId: string }>;
}

export default async function ContractDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const { contractId } = await params;
  const id = parseInt(contractId, 10);

  if (isNaN(id)) {
    notFound();
  }

  let contract: Contract | null = null;
  let error: string | null = null;

  try {
    contract = await contractsApi.get(id, token);
  } catch (e) {
    error = e instanceof Error ? e.message : "사업 정보를 불러오지 못했습니다";
  }

  if (!contract && !error) {
    notFound();
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        <Link href="/contracts" className="text-blue-600 hover:underline">
          사업 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/contracts" className="text-blue-600 hover:underline text-sm">
          사업 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{contract!.name}</h1>
            <p className="text-gray-800">{contract!.client_org}</p>
          </div>
          <StatusBadge status={contract!.status} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">사업 기간</h3>
            <p>
              {contract!.start_date} ~ {contract!.end_date}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">계약 금액</h3>
            <p>{contract!.contract_amount || "미지정"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">사업 범위</h3>
            <div className="flex gap-2">
              {contract!.scopes.length > 0 ? (
                contract!.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {SCOPE_LABELS[scope] || scope.toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="text-gray-700">없음</span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">등록일</h3>
            <p>{new Date(contract!.created_at).toLocaleString("ko-KR")}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">리스크 플래그</h2>
          <div className="grid grid-cols-3 gap-4">
            <RiskCard
              title="인수 전 환경"
              isRisk={contract!.risk_flags.pre_env}
              description="이전 사업자로부터 환경을 인수받아야 함"
            />
            <RiskCard
              title="전 사업자 협업"
              isRisk={contract!.risk_flags.prior_vendor_coordination}
              description="전 사업자와의 협업이 필요함"
            />
            <RiskCard
              title="문서 불완전"
              isRisk={contract!.risk_flags.docs_incomplete}
              description="인수 문서가 불완전하거나 누락됨"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/contracts/${contract!.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            수정
          </Link>
          <DeleteContractButton
            contractId={contract!.id}
            contractName={contract!.name}
            className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 hover:border-red-300 transition-colors"
          />
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            상태 변경
          </button>
        </div>
      </div>
    </div>
  );
}
