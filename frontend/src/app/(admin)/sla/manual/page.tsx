import Breadcrumb from "@/components/ui/breadcrumb";

const sections = [
  {
    title: "1. SLA 정의",
    href: "/sla",
    description: "사업(계약)별 SLA 항목을 등록하고 관리합니다.",
    steps: [
      "SLA 정의 목록에서 [새 SLA 정의] 버튼을 클릭합니다.",
      "대상 사업을 선택하고, SLA 명칭 / 우선순위 / 응답시간 / 해결시간 등을 입력합니다.",
      "등록된 SLA 상세 화면에서 평가 지표(메트릭)를 추가할 수 있습니다.",
      "메트릭에는 목표값, 측정 방법, 관련 작업/이벤트 등을 지정합니다.",
    ],
    tips: [
      "우선순위가 높을수록 SLA 위반 시 페널티 영향이 큽니다.",
      "응답시간과 해결시간은 시간(h) 단위로 입력합니다.",
    ],
  },
  {
    title: "2. SLA 평가",
    href: "/sla/evaluations",
    description: "월별 SLA 이행 실적을 평가하고 보고서를 생성합니다.",
    steps: [
      "SLA 평가 목록에서 [새 평가 보고서] 버튼을 클릭합니다.",
      "대상 사업과 평가 기간(연도/월)을 선택합니다.",
      "시스템이 해당 기간의 작업, 이벤트, 가동율 데이터를 자동으로 수집하여 점수를 산정합니다.",
      "평가 상세 화면에서 각 항목별 점수와 등급을 확인할 수 있습니다.",
      "검토가 완료되면 [확정] 버튼으로 보고서를 최종 확정합니다.",
    ],
    tips: [
      "확정된 보고서는 수정할 수 없으므로 검토를 충분히 한 후 확정하세요.",
      "등급 기준: S(95점 이상), A(90~94), B(80~89), C(70~79), D(70 미만)",
    ],
  },
  {
    title: "3. 배점기준",
    href: "/sla/criteria",
    description: "SLA 평가에 사용되는 카테고리별 배점기준을 조회합니다.",
    steps: [
      "배점기준 페이지에서 카테고리별로 평가항목과 서비스 수준을 확인합니다.",
      "각 평가항목에는 배점과 5단계 서비스 수준(1.0~0.2)이 정의되어 있습니다.",
    ],
    tips: [
      "서비스 수준: 1.0(목표이상), 0.8(최소이상), 0.6(최소미만), 0.4(미흡), 0.2(매우미흡)",
      "배점기준은 관리자가 백엔드에서 사전 등록합니다.",
    ],
  },
  {
    title: "4. 가동율 관리",
    href: "/sla/uptime",
    description: "장비별 가동율 기록을 등록하고 카테고리별 평균 가동율을 모니터링합니다.",
    steps: [
      "가동율 관리 페이지 상단의 입력 폼에서 장비, 기간, 가동율(%)을 입력합니다.",
      "등록된 기록은 카테고리별 요약 카드와 상세 테이블에서 확인할 수 있습니다.",
      "잘못 입력된 기록은 삭제 후 다시 등록합니다.",
    ],
    tips: [
      "가동율은 0~100% 범위로 입력합니다.",
      "SLA 평가 시 해당 기간의 가동율 데이터가 자동으로 반영됩니다.",
    ],
  },
  {
    title: "5. 벌점 관리",
    href: "/sla/penalties",
    description: "SLA 위반에 따른 벌점 부과 내역과 상계 현황을 조회합니다.",
    steps: [
      "벌점 관리 페이지에서 총 벌점, 상계 벌점, 순 벌점을 요약 카드로 확인합니다.",
      "상세 테이블에서 개별 벌점 부과/상계 내역을 조회합니다.",
    ],
    tips: [
      "벌점은 SLA 위반 이벤트 발생 시 시스템이 자동으로 부과합니다.",
      "성능개선 제안이 승인되면 벌점 상계에 반영될 수 있습니다.",
    ],
  },
  {
    title: "6. 성능개선",
    href: "/sla/improvements",
    description: "SLA 성능 향상을 위한 개선 제안을 등록하고 승인/관리합니다.",
    steps: [
      "성능개선 페이지에서 [새 개선 제안] 버튼을 클릭합니다.",
      "대상 사업과 개선 제목, 상세 내용, 예상 효과를 입력합니다.",
      "등록된 제안은 목록에서 조회하며, 관리자가 승인/반려할 수 있습니다.",
    ],
    tips: [
      "승인된 개선 제안은 벌점 상계 또는 SLA 점수 가산에 활용될 수 있습니다.",
      "구체적인 예상 효과를 기술하면 승인 가능성이 높아집니다.",
    ],
  },
  {
    title: "7. 개정요청",
    href: "/sla/revisions",
    description: "SLA 기준이나 항목의 변경이 필요할 때 개정을 요청합니다.",
    steps: [
      "개정요청 페이지에서 [새 개정요청] 버튼을 클릭합니다.",
      "대상 사업과 개정 제목, 현재 기준(변경 전), 요청 기준(변경 후), 사유를 입력합니다.",
      "관리자가 요청을 검토하여 승인/반려하며, 검토 의견을 확인할 수 있습니다.",
    ],
    tips: [
      "변경 전/후를 명확하게 기술해야 검토가 원활합니다.",
      "개정이 승인되면 해당 SLA 정의를 직접 수정해야 반영됩니다.",
    ],
  },
];

const workflow = [
  { step: "SLA 정의", desc: "사업별 SLA 항목과 목표치를 등록" },
  { step: "운영 수행", desc: "작업, 이벤트, 가동율 등 운영 데이터 축적" },
  { step: "SLA 평가", desc: "월별 실적 평가 및 등급 산정" },
  { step: "벌점 확인", desc: "위반 사항에 대한 벌점 현황 확인" },
  { step: "성능개선", desc: "개선 제안으로 벌점 상계 및 품질 향상" },
  { step: "개정요청", desc: "필요 시 SLA 기준 변경 요청" },
];

export default function SLAManualPage() {
  return (
    <div>
      <Breadcrumb />
      <h1 className="text-2xl font-semibold text-text mb-6">SLA 사용매뉴얼</h1>

      {/* Workflow overview */}
      <div className="bg-surface shadow-card rounded-lg border border-border-light p-6 mb-8">
        <h2 className="text-lg font-semibold text-text mb-4">SLA 관리 흐름</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflow.map((item, idx) => (
            <div key={idx} className="relative">
              <div className="bg-surface-sunken rounded-lg p-3 text-center h-full">
                <div className="w-7 h-7 rounded-full bg-accent text-text-on-accent text-xs font-bold flex items-center justify-center mx-auto mb-2">
                  {idx + 1}
                </div>
                <p className="text-sm font-medium text-text">{item.step}</p>
                <p className="text-xs text-text-muted mt-1">{item.desc}</p>
              </div>
              {idx < workflow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-text-muted">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section details */}
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-surface shadow-card rounded-lg border border-border-light overflow-hidden">
            <div className="bg-surface-sunken px-6 py-3 border-b border-border-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{section.title}</h2>
              <a
                href={section.href}
                className="text-sm text-accent hover:underline"
              >
                바로가기
              </a>
            </div>
            <div className="p-6">
              <p className="text-sm text-text-secondary mb-4">{section.description}</p>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-text mb-2">사용 순서</h3>
                <ol className="list-decimal list-inside space-y-1.5">
                  {section.steps.map((step, sIdx) => (
                    <li key={sIdx} className="text-sm text-text-secondary">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-accent-light rounded-md p-4">
                <h3 className="text-sm font-medium text-accent mb-2">참고사항</h3>
                <ul className="space-y-1">
                  {section.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-accent shrink-0">-</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
