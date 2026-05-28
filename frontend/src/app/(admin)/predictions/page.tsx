import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

interface EquipmentPrediction {
  id: number;
  name: string;
  serial_number: string;
  contract_name: string;
  risk_score: number;
  failure_count: number;
  days_since_last_failure: number | null;
  mtbf_days: number | null;
  age_days: number;
}

function getRiskLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "매우 높음", color: "bg-danger-bg text-danger border-danger-border" };
  if (score >= 60) return { label: "높음", color: "bg-warning-bg text-warning border-warning-border" };
  if (score >= 40) return { label: "보통", color: "bg-warning-bg text-warning border-warning-border" };
  return { label: "낮음", color: "bg-success-bg text-success border-success-border" };
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PredictionsPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<EquipmentPrediction>(
    "/v1/predictions/at-risk/",
    { token, page },
  );
  const equipment = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI 장애 예측</h1>
         <p className="text-text-muted mt-2">
          과거 장애 이력과 사용 기간을 기반으로 장애 위험도가 높은 장비를 표시합니다
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-danger-bg border border-danger-border rounded-lg p-4">
          <div className="text-sm font-medium text-danger mb-1">매우 높음</div>
          <div className="text-2xl font-bold text-danger">
            {equipment.filter(e => e.risk_score >= 80).length}
          </div>
        </div>
        <div className="bg-warning-bg border border-warning-border rounded-lg p-4">
          <div className="text-sm font-medium text-warning mb-1">높음</div>
          <div className="text-2xl font-bold text-warning">
            {equipment.filter(e => e.risk_score >= 60 && e.risk_score < 80).length}
          </div>
        </div>
        <div className="bg-warning-bg border border-warning-border rounded-lg p-4">
          <div className="text-sm font-medium text-warning mb-1">보통</div>
          <div className="text-2xl font-bold text-warning">
            {equipment.filter(e => e.risk_score >= 40 && e.risk_score < 60).length}
          </div>
        </div>
        <div className="bg-success-bg border border-success-border rounded-lg p-4">
          <div className="text-sm font-medium text-success mb-1">낮음</div>
          <div className="text-2xl font-bold text-success">
            {equipment.filter(e => e.risk_score < 40).length}
          </div>
        </div>
      </div>

       {/* Equipment List */}
       <div className="bg-surface shadow-card rounded-lg overflow-hidden">
         <div className="px-6 py-4 border-b border-border-light">
           <h2 className="text-lg font-semibold">위험 장비 목록</h2>
         </div>

         {equipment.length === 0 ? (
           <div className="p-8 text-center text-text-muted">
             위험도가 높은 장비가 없습니다
           </div>
         ) : (
           <div className="divide-y divide-border-light">
            {equipment.map((item) => {
              const risk = getRiskLevel(item.risk_score);
              return (
                 <div key={item.id} className="p-6 hover:bg-surface-sunken">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link
                        href={`/equipments/${item.id}`}
                         className="text-lg font-medium text-accent hover:underline"
                      >
                        {item.name}
                      </Link>
                       <p className="text-sm text-text-muted mt-1">
                         {item.serial_number} • {item.contract_name}
                       </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 ${risk.color}`}>
                      <div className="text-xs font-medium mb-1">위험도</div>
                      <div className="text-2xl font-bold">{item.risk_score}</div>
                      <div className="text-xs mt-1">{risk.label}</div>
                    </div>
                  </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border-light">
                     <div>
                       <div className="text-xs text-text-muted mb-1">장애 횟수</div>
                       <div className="text-sm font-medium text-text">
                         {item.failure_count}회
                       </div>
                     </div>
                     <div>
                       <div className="text-xs text-text-muted mb-1">마지막 장애</div>
                       <div className="text-sm font-medium text-text">
                         {item.days_since_last_failure !== null
                           ? `${item.days_since_last_failure}일 전`
                           : "-"}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs text-text-muted mb-1">MTBF</div>
                       <div className="text-sm font-medium text-text">
                         {item.mtbf_days !== null
                           ? `${item.mtbf_days}일`
                           : "-"}
                       </div>
                     </div>
                     <div>
                       <div className="text-xs text-text-muted mb-1">사용 기간</div>
                       <div className="text-sm font-medium text-text">
                         {item.age_days}일
                       </div>
                     </div>
                   </div>

                  {item.risk_score >= 60 && (
                    <div className="mt-4 p-3 bg-warning-bg border border-warning-border rounded-md">
                      <p className="text-sm text-warning">
                        <span className="font-medium">권장 조치:</span> 예방 점검 또는 교체를 고려하세요
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
