import Link from "next/link";
import { cookies } from "next/headers";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getRiskLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "매우 높음", color: "bg-red-100 text-red-800 border-red-300" };
  if (score >= 60) return { label: "높음", color: "bg-orange-100 text-orange-800 border-orange-300" };
  if (score >= 40) return { label: "보통", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
  return { label: "낮음", color: "bg-green-100 text-green-800 border-green-300" };
}

async function getAtRiskEquipment(token?: string): Promise<EquipmentPrediction[]> {
  try {
    const res = await fetch(`${API_URL}/v1/predictions/at-risk/`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export default async function PredictionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  
  const equipment = await getAtRiskEquipment(token);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI 장애 예측</h1>
        <p className="text-gray-600 mt-2">
          과거 장애 이력과 사용 기간을 기반으로 장애 위험도가 높은 장비를 표시합니다
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">매우 높음</div>
          <div className="text-2xl font-bold text-red-600">
            {equipment.filter(e => e.risk_score >= 80).length}
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-sm font-medium text-orange-800 mb-1">높음</div>
          <div className="text-2xl font-bold text-orange-600">
            {equipment.filter(e => e.risk_score >= 60 && e.risk_score < 80).length}
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800 mb-1">보통</div>
          <div className="text-2xl font-bold text-yellow-600">
            {equipment.filter(e => e.risk_score >= 40 && e.risk_score < 60).length}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-medium text-green-800 mb-1">낮음</div>
          <div className="text-2xl font-bold text-green-600">
            {equipment.filter(e => e.risk_score < 40).length}
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">위험 장비 목록</h2>
        </div>

        {equipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            위험도가 높은 장비가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {equipment.map((item) => {
              const risk = getRiskLevel(item.risk_score);
              return (
                <div key={item.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link
                        href={`/equipments/${item.id}`}
                        className="text-lg font-medium text-blue-600 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.serial_number} • {item.contract_name}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border-2 ${risk.color}`}>
                      <div className="text-xs font-medium mb-1">위험도</div>
                      <div className="text-2xl font-bold">{item.risk_score}</div>
                      <div className="text-xs mt-1">{risk.label}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">장애 횟수</div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.failure_count}회
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">마지막 장애</div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.days_since_last_failure !== null 
                          ? `${item.days_since_last_failure}일 전`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">MTBF</div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.mtbf_days !== null 
                          ? `${item.mtbf_days}일`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">사용 기간</div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.age_days}일
                      </div>
                    </div>
                  </div>

                  {item.risk_score >= 60 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm text-orange-800">
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
    </div>
  );
}
