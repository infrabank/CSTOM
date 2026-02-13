"""Management command to seed KB categories and templates."""

from django.core.management.base import BaseCommand

from kb.models import KBCategory, KBTemplate


# fmt: off
CATEGORIES = [
    {
        "name": "하드웨어",
        "description": "하드웨어 관련 장애 및 문제 해결",
    },
    {
        "name": "소프트웨어",
        "description": "소프트웨어 오류, 설정 및 애플리케이션 문제",
    },
    {
        "name": "네트워크",
        "description": "네트워크 연결, 라우팅 및 통신 문제",
    },
    {
        "name": "보안",
        "description": "보안 사고, 취약점 및 접근 권한 문제",
    },
    {
        "name": "성능",
        "description": "성능 저하, 최적화 및 용량 문제",
    },
    {
        "name": "일반",
        "description": "일반 문제 해결 및 운영 절차",
    },
]

TEMPLATES = [
    # -- 하드웨어 장애 --
    {
        "name": "하드웨어 장애 보고서",
        "incident_type": "hardware_failure",
        "category_name": "하드웨어",
        "template_content": (
            "# 하드웨어 장애 보고서\n\n"
            "## 사고 개요\n"
            "- **장비명**: \n"
            "- **설치 위치**: \n"
            "- **보고자**: \n"
            "- **발생 일시**: \n\n"
            "## 증상\n"
            "관찰된 증상을 기술하세요:\n"
            "1. \n"
            "2. \n\n"
            "## 원인 분석\n"
            "하드웨어 장애의 근본 원인:\n\n"
            "## 영향 범위\n"
            "- **영향받은 시스템**: \n"
            "- **중단 시간**: \n"
            "- **영향받은 사용자**: \n\n"
            "## 조치 내역\n"
            "문제 해결을 위해 수행한 단계:\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## 재발 방지 대책\n"
            "재발 방지를 위한 권고사항:\n"
            "- \n"
        ),
    },
    # -- 소프트웨어 오류 --
    {
        "name": "소프트웨어 오류 해결",
        "incident_type": "software_error",
        "category_name": "소프트웨어",
        "template_content": (
            "# 소프트웨어 오류 해결\n\n"
            "## 오류 개요\n"
            "- **애플리케이션**: \n"
            "- **환경**: (운영 / 스테이징 / 개발)\n"
            "- **오류 코드/메시지**: \n"
            "- **최초 발생 일시**: \n\n"
            "## 재현 절차\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## 기대 동작 vs 실제 동작\n"
            "- **기대 동작**: \n"
            "- **실제 동작**: \n\n"
            "## 원인 분석\n"
            "확인된 근본 원인을 기술하세요:\n\n"
            "## 적용된 수정 사항\n"
            "```\n"
            "관련 코드 변경 또는 설정 업데이트를 여기에 붙여넣으세요\n"
            "```\n\n"
            "## 검증\n"
            "수정 사항 검증 방법:\n"
            "- [ ] 단위 테스트 통과\n"
            "- [ ] 통합 테스트 통과\n"
            "- [ ] 수동 검증 완료\n\n"
            "## 관련 자료\n"
            "- 티켓/이슈: \n"
            "- PR/커밋: \n"
        ),
    },
    # -- 네트워크 장애 --
    {
        "name": "네트워크 장애 진단",
        "incident_type": "network_issue",
        "category_name": "네트워크",
        "template_content": (
            "# 네트워크 장애 진단\n\n"
            "## 사고 상세\n"
            "- **영향받은 네트워크 구간**: \n"
            "- **심각도**: (긴급 / 높음 / 보통 / 낮음)\n"
            "- **발생 시각**: \n"
            "- **해결 시각**: \n\n"
            "## 증상\n"
            "- [ ] 완전한 연결 끊김\n"
            "- [ ] 간헐적 연결 불안정\n"
            "- [ ] 높은 지연 시간\n"
            "- [ ] 패킷 손실\n"
            "- [ ] DNS 해석 실패\n"
            "- [ ] 기타: \n\n"
            "## 진단 절차\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## 진단 결과\n"
            "진단 결과를 기술하세요:\n\n"
            "## 조치 내역\n"
            "연결 복구를 위해 수행한 단계:\n"
            "1. \n"
            "2. \n\n"
            "## 사후 모니터링\n"
            "해결 후 모니터링 조치:\n"
            "- \n"
        ),
    },
    # -- 보안 사고 --
    {
        "name": "보안 사고 대응",
        "incident_type": "security_incident",
        "category_name": "보안",
        "template_content": (
            "# 보안 사고 대응\n\n"
            "## 분류\n"
            "- **심각도**: (긴급 / 높음 / 보통 / 낮음)\n"
            "- **유형**: (비인가 접근 / 악성코드 / 데이터 유출 / 피싱 / 기타)\n"
            "- **탐지 방법**: \n"
            "- **탐지 일시**: \n\n"
            "## 영향 범위\n"
            "- **영향받은 시스템**: \n"
            "- **영향받은 데이터**: \n"
            "- **영향받은 사용자**: \n\n"
            "## 초동 대응\n"
            "사고 억제를 위해 취한 즉각적 조치:\n"
            "1. \n"
            "2. \n\n"
            "## 조사 결과\n"
            "조사를 통해 확인된 사항:\n\n"
            "## 제거 및 복구\n"
            "위협 제거 및 운영 복구를 위해 수행한 단계:\n"
            "1. \n"
            "2. \n\n"
            "## 교훈\n"
            "- 잘된 점: \n"
            "- 개선할 점: \n"
            "- 후속 조치: \n"
        ),
    },
    # -- 성능 저하 --
    {
        "name": "성능 저하 분석",
        "incident_type": "performance_degradation",
        "category_name": "성능",
        "template_content": (
            "# 성능 저하 분석\n\n"
            "## 개요\n"
            "- **시스템/서비스**: \n"
            "- **영향받은 지표**: (응답 시간 / 처리량 / CPU / 메모리 / 디스크 I/O)\n"
            "- **기준값**: \n"
            "- **저하값**: \n"
            "- **지속 시간**: \n\n"
            "## 타임라인\n"
            "| 시각 | 이벤트 |\n"
            "| --- | --- |\n"
            "| | 문제 감지 |\n"
            "| | 조사 시작 |\n"
            "| | 원인 파악 |\n"
            "| | 수정 적용 |\n"
            "| | 성능 복구 |\n\n"
            "## 원인 분석\n"
            "성능 저하의 근본 원인:\n\n"
            "## 적용된 최적화\n"
            "성능 복구를 위해 변경한 사항:\n"
            "1. \n"
            "2. \n\n"
            "## 결과\n"
            "최적화 후 성능 지표:\n"
            "- 이전: \n"
            "- 이후: \n\n"
            "## 모니터링 업데이트\n"
            "새로 설정한 알림 또는 임계치:\n"
            "- \n"
        ),
    },
    # -- 일반 / 기타 --
    {
        "name": "일반 문제 해결 가이드",
        "incident_type": "other",
        "category_name": "일반",
        "template_content": (
            "# 일반 문제 해결 가이드\n\n"
            "## 문제 설명\n"
            "문제를 명확하게 기술하세요:\n\n"
            "## 환경 정보\n"
            "- **시스템/서비스**: \n"
            "- **버전**: \n"
            "- **설정**: \n\n"
            "## 재현 절차\n"
            "1. \n"
            "2. \n"
            "3. \n\n"
            "## 조사 내역\n"
            "수행한 진단 단계:\n"
            "1. \n"
            "2. \n\n"
            "## 해결 방법\n"
            "문제 해결 절차:\n"
            "1. \n"
            "2. \n\n"
            "## 비고\n"
            "추가 맥락 또는 참고 자료:\n"
            "- \n"
        ),
    },
    {
        "name": "표준 운영 절차 (SOP)",
        "incident_type": "other",
        "category_name": "일반",
        "template_content": (
            "# 표준 운영 절차 (SOP)\n\n"
            "## 목적\n"
            "본 절차의 목적을 기술하세요:\n\n"
            "## 적용 범위\n"
            "본 절차의 적용 대상 및 범위:\n\n"
            "## 사전 요건\n"
            "- \n"
            "- \n\n"
            "## 절차\n"
            "### 1단계: \n"
            "설명:\n\n"
            "### 2단계: \n"
            "설명:\n\n"
            "### 3단계: \n"
            "설명:\n\n"
            "## 완료 확인\n"
            "절차가 정상 완료되었는지 확인하는 방법:\n"
            "- [ ] \n"
            "- [ ] \n\n"
            "## 롤백 계획\n"
            "문제 발생 시 복구 절차:\n"
            "1. \n"
            "2. \n\n"
            "## 참고 자료\n"
            "- \n"
        ),
    },
]
# fmt: on


class Command(BaseCommand):
    """Seed KB categories and templates."""

    help = "Create initial KB categories and templates"

    def handle(self, *args, **options):
        # Seed categories first
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = KBCategory.objects.get_or_create(
                name=cat_data["name"],
                defaults={"description": cat_data["description"]},
            )
            cat_map[cat_data["name"]] = cat
            status = "Created" if created else "Already exists"
            self.stdout.write(f"  Category: {cat_data['name']} - {status}")

        self.stdout.write("")

        # Seed templates
        created_count = 0
        for tmpl_data in TEMPLATES:
            category = cat_map.get(tmpl_data["category_name"])
            _, created = KBTemplate.objects.get_or_create(
                name=tmpl_data["name"],
                defaults={
                    "incident_type": tmpl_data["incident_type"],
                    "category": category,
                    "template_content": tmpl_data["template_content"],
                },
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  Created template: {tmpl_data['name']}")
                )
            else:
                self.stdout.write(f"  Template already exists: {tmpl_data['name']}")

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created_count} new template(s), "
                f"{len(TEMPLATES) - created_count} already existed."
            )
        )
