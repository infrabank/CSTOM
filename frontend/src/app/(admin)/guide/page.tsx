import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

interface ManualSection {
  title: string;
  href: string;
  description: string;
  steps: string[];
  tips: string[];
}

interface ManualGroup {
  groupTitle: string;
  sections: ManualSection[];
}

const groups: ManualGroup[] = [
  {
    groupTitle: "대시보드",
    sections: [
      {
        title: "대시보드",
        href: "/dashboard",
        description:
          "운영 현황을 한눈에 파악할 수 있는 종합 모니터링 화면입니다. 기간별 KPI, 계약 현황, 최근 장애/작업 등을 확인합니다.",
        steps: [
          "상단의 기간 선택 버튼(오늘/주간/월간/분기)으로 조회 기간을 변경합니다.",
          "KPI 카드에서 SLA 준수율, 평균복구시간(MTTR), 점검완료율, 총 작업 수를 확인합니다.",
          "통계 그리드에서 활성 사업, 위험 사업, 반출 장비, 고영향 작업, 대기 승인 현황을 확인합니다.",
          "승인 대기 알림이 있으면 직접 클릭하여 해당 작업으로 이동할 수 있습니다.",
          "하단의 계약 현황, 최근 장애, 장비 현황, 최근 작업 섹션에서 상세 정보를 확인합니다.",
        ],
        tips: [
          "SLA 준수율: 90% 이상(녹색), 70~89%(황색), 70% 미만(적색)으로 표시됩니다.",
          "각 요약 섹션의 [전체 보기] 링크로 상세 목록 페이지로 이동할 수 있습니다.",
          "대기 승인 카드를 클릭하면 승인 필요 작업 목록으로 바로 이동합니다.",
        ],
      },
    ],
  },
  {
    groupTitle: "운영관리",
    sections: [
      {
        title: "사업관리",
        href: "/contracts",
        description:
          "유지보수 계약(사업)을 등록하고 관리합니다. 모든 작업, 이벤트, 장비, 점검은 사업 단위로 관리됩니다.",
        steps: [
          "사업관리 목록에서 [사업 등록] 버튼을 클릭하여 새 사업을 등록합니다.",
          "사업명, 발주기관, 계약기간(시작일/종료일)은 필수 입력 항목입니다.",
          "계약범위(운영/구축/전환/PM)와 리스크 요소(사전환경/협업/문서)를 선택합니다.",
          "등록 후 상세 화면에서 상태 변경(사전인수→인수→안정화→정상운영→종료)이 가능합니다.",
          "목록에서 사업명 또는 발주기관으로 검색하고, 상태별로 필터링할 수 있습니다.",
        ],
        tips: [
          "사업은 다른 모든 데이터(작업, 이벤트, 장비 등)의 상위 단위입니다. 먼저 사업을 등록하세요.",
          "리스크 플래그가 설정된 사업은 대시보드에서 위험 사업으로 표시됩니다.",
          "상태는 순서대로만 변경할 수 있습니다.",
        ],
      },
      {
        title: "작업관리",
        href: "/tasks",
        description:
          "정기/장애/변경/요청 유형의 작업을 등록하고, 승인 워크플로우를 관리합니다.",
        steps: [
          "작업 목록에서 [작업 등록] 버튼을 클릭합니다.",
          "대상 사업을 선택하고, 제목, 작업 유형, 영향도를 입력합니다.",
          "영향도가 '전체 영향'이거나 유형이 '변경'이면 자동으로 승인 필요 상태가 됩니다.",
          "선택한 사업에 연관된 이벤트(장애/변경)가 있으면 연결할 수 있습니다.",
          "목록의 [승인 대기] 탭에서 승인이 필요한 작업을 필터링할 수 있습니다.",
          "작업 상세에서 승인/반려 처리와 의사결정 이력을 확인합니다.",
        ],
        tips: [
          "작업 유형: 정기(routine), 장애(incident), 변경(change), 요청(request)",
          "영향도: 없음(none), 부분 영향(partial), 전체 영향(full)",
          "승인 대기 작업은 대시보드에서도 알림으로 표시됩니다.",
        ],
      },
      {
        title: "예방점검",
        href: "/inspections",
        description:
          "장비 유형별 예방점검 스케줄을 등록하고, 스케줄에 따른 점검 작업을 관리합니다.",
        steps: [
          "[점검 스케줄 등록] 버튼으로 점검 스케줄을 생성합니다.",
          "대상 사업, 장비 유형, 점검 주기(월간/분기/반기/연간), 담당자를 입력합니다.",
          "등록된 스케줄 상세에서 자동 생성된 점검 작업 목록을 확인합니다.",
          "[점검 작업] 탭에서 전체 점검 작업을 상태별(대기/진행중/완료)로 필터링합니다.",
          "각 점검 작업에서 완료 처리 및 결과를 기록합니다.",
        ],
        tips: [
          "점검 스케줄의 활성/비활성 상태로 작업 자동 생성을 제어할 수 있습니다.",
          "점검 완료율은 대시보드 KPI에 자동 반영됩니다.",
          "SLA 평가 시 점검 이행률이 평가 항목으로 활용됩니다.",
        ],
      },
      {
        title: "변경/장애",
        href: "/events",
        description:
          "변경 작업과 장애 발생을 기록하고 추적합니다. 고객 통보 및 관련 이벤트 연결을 관리합니다.",
        steps: [
          "[이벤트 등록] 버튼으로 변경 또는 장애 이벤트를 등록합니다.",
          "사업 선택 후 유형(변경/장애), 제목, 발생시각을 입력합니다.",
          "장애 이벤트의 경우 심각도(1등급/2등급/3등급)를 지정합니다.",
          "해결 후 해결시각을 기록하고, 고객 통보 여부와 시각을 입력합니다.",
          "상세 화면에서 관련 이벤트를 연결하거나 1차 공지/감사 보고 요약을 작성합니다.",
        ],
        tips: [
          "심각도는 SLA 평가 시 가중치로 반영됩니다 (1등급: 3배, 2등급: 2배, 3등급: 1배).",
          "고객 미통보 이벤트는 목록에서 별도 표시됩니다.",
          "관련 이벤트 연결로 연쇄 장애를 추적할 수 있습니다.",
        ],
      },
      {
        title: "티켓",
        href: "/tickets",
        description:
          "고객 요청이나 내부 이슈를 티켓으로 등록하고, 우선순위/상태별로 관리합니다.",
        steps: [
          "[새 티켓 생성] 버튼으로 티켓을 등록합니다.",
          "제목, 상세 내용, 우선순위(긴급/높음/보통/낮음)를 입력합니다.",
          "관련 사업과 담당자를 선택할 수 있습니다.",
          "티켓 상세 화면에서 코멘트를 추가하여 진행 상황을 기록합니다.",
          "내부 코멘트 체크박스로 고객에게 노출되지 않는 메모를 남길 수 있습니다.",
          "상태를 접수(open) → 진행중 → 해결 → 종료 순서로 변경합니다.",
        ],
        tips: [
          "우선순위: 긴급(critical), 높음(high), 보통(medium), 낮음(low)",
          "상태: open(접수), in_progress(진행중), resolved(해결), closed(종료)",
          "내부 코멘트는 엔지니어 간 협의에 활용합니다.",
        ],
      },
      {
        title: "인력관리",
        href: "/workforce",
        description:
          "엔지니어 프로필과 전문분야, 보유기술, 가용 상태를 관리합니다.",
        steps: [
          "[엔지니어 등록] 버튼으로 엔지니어 프로필을 등록합니다.",
          "이름, 이메일, 전문분야, 보유기술을 입력합니다.",
          "가용 상태를 설정합니다 (가용/바쁨/휴가/불가).",
          "[일정 관리] 버튼으로 엔지니어 일정을 관리합니다.",
        ],
        tips: [
          "가용 상태: available(가용), busy(바쁨), on_leave(휴가), unavailable(불가)",
          "작업 배정 시 엔지니어 가용 상태를 참고하세요.",
        ],
      },
    ],
  },
  {
    groupTitle: "문서관리",
    sections: [
      {
        title: "SOP",
        href: "/sop",
        description:
          "표준운영절차(SOP) 문서를 작성, 관리하고 카테고리별로 분류합니다.",
        steps: [
          "[새 SOP 작성] 버튼으로 SOP 문서를 생성합니다.",
          "제목, 카테고리, 본문 내용을 입력합니다. 본문은 마크다운 형식을 지원합니다.",
          "[카테고리 관리] 버튼으로 SOP 카테고리를 추가/수정/삭제합니다.",
          "목록에서 제목을 클릭하여 상세 내용을 조회합니다.",
          "수정 시 버전이 자동으로 증가합니다.",
        ],
        tips: [
          "마크다운으로 작성하면 표, 목록, 코드 블록 등을 활용할 수 있습니다.",
          "카테고리별로 SOP를 분류하면 검색이 용이합니다.",
          "버전 이력으로 문서 변경 내역을 추적할 수 있습니다.",
        ],
      },
      {
        title: "지식베이스",
        href: "/kb",
        description:
          "운영 노하우, 장애 해결 사례 등을 아티클로 작성하여 공유합니다.",
        steps: [
          "[새 아티클 작성] 버튼으로 KB 문서를 생성합니다.",
          "제목, 카테고리, 본문 내용을 입력합니다. 마크다운 형식을 지원합니다.",
          "공개/비공개 설정으로 노출 범위를 지정합니다.",
          "목록에서 제목, 내용, 태그로 검색할 수 있습니다.",
          "아티클 하단의 도움됨(helpful) 버튼으로 유용한 문서를 표시합니다.",
        ],
        tips: [
          "조회수와 도움됨 수로 문서의 유용성을 판단할 수 있습니다.",
          "비공개 문서는 작성자와 관리자만 볼 수 있습니다.",
          "장애 해결 후 해결 과정을 KB에 기록하면 재발 시 빠른 대응이 가능합니다.",
        ],
      },
      {
        title: "보고서",
        href: "/reports",
        description:
          "월간 보고서, 장애 보고서, 감사 보고서를 생성하고 관리합니다.",
        steps: [
          "[보고서 생성] 버튼을 클릭합니다.",
          "보고서 유형(월간/장애/감사)과 대상 사업을 선택합니다.",
          "보고 기간(시작일~종료일)을 지정합니다.",
          "시스템이 해당 기간의 데이터를 자동으로 수집하여 보고서를 생성합니다.",
          "생성된 보고서 목록에서 클릭하여 상세 내용을 조회합니다.",
        ],
        tips: [
          "보고서 유형: 월간(monthly), 장애(incident), 감사(audit)",
          "보고서 생성 전에 해당 기간의 작업, 이벤트 데이터가 충분히 입력되어 있어야 합니다.",
          "SLA 평가 보고서는 SLA관리 > SLA 평가에서 별도로 생성합니다.",
        ],
      },
    ],
  },
  {
    groupTitle: "시스템",
    sections: [
      {
        title: "장비관리",
        href: "/equipments",
        description:
          "IT 장비의 반출입을 관리하고, 장비 현황을 카테고리/상태별로 추적합니다.",
        steps: [
          "[장비 등록] 버튼으로 새 장비를 등록합니다.",
          "장비명, 시리얼번호, 카테고리(서버/네트워크/스토리지/보안/PC/기타), 소속 사업을 입력합니다.",
          "장비 상세에서 반출(check_out)/반입(check_in) 처리를 합니다.",
          "목록에서 장비명, 시리얼번호, 사업명으로 검색하고 상태/카테고리로 필터링합니다.",
          "마지막 반출입 이력(유형, 처리자)을 목록에서 바로 확인할 수 있습니다.",
        ],
        tips: [
          "상태: 보관중(available), 반출중(checked_out), 점검중(maintenance), 폐기(retired)",
          "QR 스캔 기능과 연동하여 장비를 빠르게 조회할 수 있습니다.",
          "AI 예측에서 장비의 장애 위험도를 확인할 수 있습니다.",
        ],
      },
      {
        title: "사용자",
        href: "/users",
        description: "시스템 사용자 계정과 역할을 관리합니다.",
        steps: [
          "[사용자 등록] 버튼으로 새 사용자를 등록합니다.",
          "사용자명, 표시 이름, 이메일을 입력합니다.",
          "역할을 하나 이상 지정합니다 (관리자/PM/엔지니어/고객).",
          "상태를 활성/비활성으로 설정합니다.",
        ],
        tips: [
          "역할: admin(관리자), pm(PM), engineer(엔지니어), customer(고객)",
          "한 사용자에게 여러 역할을 부여할 수 있습니다.",
          "비활성 사용자는 로그인할 수 없습니다.",
        ],
      },
      {
        title: "AI 예측",
        href: "/predictions",
        description:
          "장비의 장애 이력과 사용 기간을 기반으로 AI가 장애 위험도를 예측합니다.",
        steps: [
          "AI 예측 페이지에서 위험도별 요약 카드를 확인합니다 (매우높음/높음/보통/낮음).",
          "위험 장비 목록에서 각 장비의 위험 점수(0~100)와 세부 지표를 확인합니다.",
          "세부 지표: 장애 횟수, 마지막 장애 후 경과일, MTBF(평균장애간격), 가동일수",
          "위험도 60 이상 장비에는 예방점검 또는 교체 권고가 표시됩니다.",
          "장비명을 클릭하여 장비 상세 페이지로 이동할 수 있습니다.",
        ],
        tips: [
          "위험도 기준: 매우높음(80+), 높음(60~79), 보통(40~59), 낮음(40 미만)",
          "위험도는 장애 이력 + 사용 기간을 기반으로 산정됩니다.",
          "정기적으로 확인하여 사전 조치를 취하면 장애를 예방할 수 있습니다.",
        ],
      },
      {
        title: "알림",
        href: "/notifications",
        description:
          "SLA 위반, 작업 배정, 장애 발생, 승인 요청 등 시스템 알림을 확인합니다.",
        steps: [
          "알림 목록에서 읽지 않은 알림은 강조 표시됩니다.",
          "각 알림의 유형 배지와 내용을 확인합니다.",
          "알림을 클릭하면 해당 항목의 상세 페이지로 이동합니다.",
        ],
        tips: [
          "알림 유형: SLA 위반, 작업 배정, 장애 발생, 승인 필요, 시스템",
          "읽지 않은 알림은 좌측에 색상 표시가 됩니다.",
          "중요한 알림은 대시보드에서도 표시됩니다.",
        ],
      },
      {
        title: "감사로그",
        href: "/audit",
        description:
          "시스템에서 발생한 모든 활동(생성/수정/삭제/상태변경/승인/로그인 등)을 기록합니다.",
        steps: [
          "감사로그 목록에서 시간순으로 활동 이력을 조회합니다.",
          "각 로그에서 행위 유형, 대상 엔티티, 수행자 이메일, IP 주소를 확인합니다.",
        ],
        tips: [
          "행위 유형: create(생성), update(수정), delete(삭제), status_change(상태변경), approve(승인), reject(반려), login(로그인), logout(로그아웃)",
          "대상 엔티티: contract, task, event, equipment, report, user, ticket, sla",
          "감사로그는 수정/삭제가 불가능한 읽기 전용 기록입니다.",
        ],
      },
      {
        title: "QR 스캔",
        href: "/scan",
        description:
          "장비에 부착된 QR 코드를 카메라로 스캔하여 장비 정보를 빠르게 조회합니다.",
        steps: [
          "QR 스캔 페이지에서 카메라 접근 권한을 허용합니다.",
          "장비에 부착된 QR 코드를 카메라에 비춥니다.",
          "스캔이 성공하면 자동으로 해당 장비 상세 페이지로 이동합니다.",
        ],
        tips: [
          "카메라 접근 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.",
          "QR 코드에는 장비 ID가 인코딩되어 있습니다.",
          "모바일 환경에서 현장 점검 시 유용합니다.",
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function GuidePage() {
  return (
    <div>
      <Breadcrumb />
      <h1 className="text-2xl font-semibold text-text mb-2">
        CSTOM 사용매뉴얼
      </h1>
      <p className="text-sm text-text-muted mb-8">
        IT 유지보수 통합 관리 시스템(CSTOM)의 전체 기능 사용법을 안내합니다.
      </p>

      {/* Quick nav */}
      <div className="bg-surface shadow-card rounded-lg border border-border-light p-6 mb-8">
        <h2 className="text-lg font-semibold text-text mb-4">목차</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div key={group.groupTitle}>
              <h3 className="text-sm font-semibold text-text mb-2">
                {group.groupTitle}
              </h3>
              <ul className="space-y-1">
                {group.sections.map((s) => (
                  <li key={s.href}>
                    <a
                      href={`#${s.href.replace(/\//g, "-").slice(1)}`}
                      className="text-sm text-accent hover:underline"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">SLA관리</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/sla/manual"
                  className="text-sm text-accent hover:underline"
                >
                  SLA 사용매뉴얼 →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Group sections */}
      {groups.map((group) => (
        <div key={group.groupTitle} className="mb-10">
          <h2 className="text-xl font-bold text-text mb-4 pb-2 border-b border-border-light">
            {group.groupTitle}
          </h2>

          <div className="space-y-6">
            {group.sections.map((section) => (
              <div
                key={section.href}
                id={section.href.replace(/\//g, "-").slice(1)}
                className="bg-surface shadow-card rounded-lg border border-border-light overflow-hidden scroll-mt-4"
              >
                <div className="bg-surface-sunken px-6 py-3 border-b border-border-light flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">
                    {section.title}
                  </h3>
                  <Link
                    href={section.href}
                    className="text-sm text-accent hover:underline"
                  >
                    바로가기
                  </Link>
                </div>
                <div className="p-6">
                  <p className="text-sm text-text-secondary mb-4">
                    {section.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text mb-2">
                      사용 순서
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5">
                      {section.steps.map((step, i) => (
                        <li key={i} className="text-sm text-text-secondary">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-accent-light rounded-md p-4">
                    <h4 className="text-sm font-medium text-accent mb-2">
                      참고사항
                    </h4>
                    <ul className="space-y-1">
                      {section.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-sm text-text-secondary flex gap-2"
                        >
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
      ))}

      {/* SLA link */}
      <div className="bg-surface shadow-card rounded-lg border border-border-light p-6 text-center">
        <p className="text-sm text-text-secondary mb-3">
          SLA 관리 기능에 대한 매뉴얼은 별도 페이지에서 확인하세요.
        </p>
        <Link
          href="/sla/manual"
          className="inline-block px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover text-sm"
        >
          SLA 사용매뉴얼 보기
        </Link>
      </div>
    </div>
  );
}
