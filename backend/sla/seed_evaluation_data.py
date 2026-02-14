"""
Seed SLA evaluation categories and items from KRIHS standard.

Usage:
    python manage.py shell < sla/seed_evaluation_data.py

Or import and call:
    from sla.seed_evaluation_data import seed_sla_evaluation_data
    seed_sla_evaluation_data(contract_id)
"""


def seed_sla_evaluation_data(contract_id):
    """Seed SLA categories and evaluation items for a contract."""
    from sla.models import SLACategory, SLAEvaluationItem
    from contracts.models import Contract

    contract = Contract.objects.get(id=contract_id)

    CATEGORIES = [
        {
            "name": "장애관리",
            "code": "fault_mgmt",
            "weight_percent": 30,
            "display_order": 1,
        },
        {
            "name": "가동율",
            "code": "availability",
            "weight_percent": 30,
            "display_order": 2,
        },
        {
            "name": "구성관리",
            "code": "config_mgmt",
            "weight_percent": 20,
            "display_order": 3,
        },
        {
            "name": "보안관리",
            "code": "security_mgmt",
            "weight_percent": 20,
            "display_order": 4,
        },
    ]

    ITEMS = {
        "fault_mgmt": [
            {"item_number": 1, "name": "장애 발생 건수", "weight": 10},
            {"item_number": 2, "name": "유지보수 적기처리율", "weight": 10},
            {"item_number": 3, "name": "장애원인 분석 및 장애보고서 작성", "weight": 5},
            {"item_number": 4, "name": "시스템 월 정기점검 이행", "weight": 5},
        ],
        "availability": [
            {"item_number": 5, "name": "서버 가동율", "weight": 5},
            {"item_number": 6, "name": "네트워크 가동율", "weight": 5},
            {"item_number": 7, "name": "보안솔루션 가동율", "weight": 5},
            {"item_number": 8, "name": "상용SW 가동율", "weight": 5},
            {"item_number": 9, "name": "응용SW 가동율", "weight": 10},
        ],
        "config_mgmt": [
            {"item_number": 10, "name": "유지보수 대상시스템 현행화", "weight": 10},
            {"item_number": 11, "name": "네트워크 보안시스템 변경 이력", "weight": 5},
            {"item_number": 12, "name": "작업/완료보고서 작성", "weight": 5},
        ],
        "security_mgmt": [
            {"item_number": 13, "name": "정보보안 교육 및 실태점검 이행", "weight": 10},
            {"item_number": 14, "name": "정보 대외유출 위반건수", "weight": 10},
        ],
    }

    created_categories = 0
    created_items = 0

    for cat_data in CATEGORIES:
        category, created = SLACategory.objects.get_or_create(
            contract=contract,
            code=cat_data["code"],
            defaults={
                "name": cat_data["name"],
                "weight_percent": cat_data["weight_percent"],
                "display_order": cat_data["display_order"],
            },
        )
        if created:
            created_categories += 1

        for item_data in ITEMS.get(cat_data["code"], []):
            _, item_created = SLAEvaluationItem.objects.get_or_create(
                category=category,
                item_number=item_data["item_number"],
                defaults={
                    "name": item_data["name"],
                    "weight": item_data["weight"],
                    "measurement_cycle": "monthly",
                },
            )
            if item_created:
                created_items += 1

    print(
        f"Created {created_categories} categories, {created_items} items for contract: {contract.name}"
    )
    return created_categories, created_items


def seed_evaluation_criteria(contract_id):
    """Seed scoring criteria text for all 14 items x 5 levels (70 records).

    Based on KRIHS SLA document scoring table (Article 12).
    """
    from decimal import Decimal
    from sla.models import SLAEvaluationItem, SLAEvaluationCriteria, SLACategory
    from contracts.models import Contract

    contract = Contract.objects.get(id=contract_id)

    # Criteria text per item_number per service_level
    CRITERIA = {
        1: {  # 장애 발생 건수 (가중치: 심각도1=1.0건, 심각도2=0.5건, 심각도3=제외)
            "1.0": "가중 장애건수 0건 (심각도1=1.0, 심각도2=0.5, 심각도3=제외)",
            "0.8": "가중 장애건수 1건 이하",
            "0.6": "가중 장애건수 2건 이하",
            "0.4": "가중 장애건수 3건 이하",
            "0.2": "가중 장애건수 3건 초과",
        },
        2: {  # 유지보수 적기처리율
            "1.0": "적기처리율 100%",
            "0.8": "적기처리율 95% 이상",
            "0.6": "적기처리율 90% 이상",
            "0.4": "적기처리율 85% 이상",
            "0.2": "적기처리율 85% 미만",
        },
        3: {  # 장애원인 분석 및 장애보고서 작성
            "1.0": "장애발생 후 4시간 이내 분석보고서 작성",
            "0.8": "장애발생 후 8시간 이내 분석보고서 작성",
            "0.6": "장애발생 후 24시간 이내 분석보고서 작성",
            "0.4": "장애발생 후 48시간 이내 분석보고서 작성",
            "0.2": "장애발생 후 48시간 초과 또는 미작성",
        },
        4: {  # 시스템 월 정기점검 이행
            "1.0": "월 정기점검 100% 이행 및 보고서 적시 제출",
            "0.8": "월 정기점검 100% 이행, 보고서 지연 제출",
            "0.6": "월 정기점검 90% 이상 이행",
            "0.4": "월 정기점검 80% 이상 이행",
            "0.2": "월 정기점검 80% 미만 이행",
        },
        5: {  # 서버 가동율
            "1.0": "가동율 99.5% 이상",
            "0.8": "가동율 99.0% 이상",
            "0.6": "가동율 98.5% 이상",
            "0.4": "가동율 98.0% 이상",
            "0.2": "가동율 98.0% 미만",
        },
        6: {  # 네트워크 가동율
            "1.0": "가동율 99.5% 이상",
            "0.8": "가동율 99.0% 이상",
            "0.6": "가동율 98.5% 이상",
            "0.4": "가동율 98.0% 이상",
            "0.2": "가동율 98.0% 미만",
        },
        7: {  # 보안솔루션 가동율
            "1.0": "가동율 99.5% 이상",
            "0.8": "가동율 99.0% 이상",
            "0.6": "가동율 98.5% 이상",
            "0.4": "가동율 98.0% 이상",
            "0.2": "가동율 98.0% 미만",
        },
        8: {  # 상용SW 가동율
            "1.0": "가동율 99.5% 이상",
            "0.8": "가동율 99.0% 이상",
            "0.6": "가동율 98.5% 이상",
            "0.4": "가동율 98.0% 이상",
            "0.2": "가동율 98.0% 미만",
        },
        9: {  # 응용SW 가동율
            "1.0": "가동율 99.5% 이상",
            "0.8": "가동율 99.0% 이상",
            "0.6": "가동율 98.5% 이상",
            "0.4": "가동율 98.0% 이상",
            "0.2": "가동율 98.0% 미만",
        },
        10: {  # 유지보수 대상시스템 현행화
            "1.0": "현행화율 100%",
            "0.8": "현행화율 95% 이상",
            "0.6": "현행화율 90% 이상",
            "0.4": "현행화율 85% 이상",
            "0.2": "현행화율 85% 미만",
        },
        11: {  # 네트워크 보안시스템 변경 이력
            "1.0": "변경이력 100% 관리 및 즉시 반영",
            "0.8": "변경이력 95% 이상 관리",
            "0.6": "변경이력 90% 이상 관리",
            "0.4": "변경이력 85% 이상 관리",
            "0.2": "변경이력 85% 미만 관리",
        },
        12: {  # 작업/완료보고서 작성
            "1.0": "보고서 작성율 100%",
            "0.8": "보고서 작성율 95% 이상",
            "0.6": "보고서 작성율 90% 이상",
            "0.4": "보고서 작성율 85% 이상",
            "0.2": "보고서 작성율 85% 미만",
        },
        13: {  # 정보보안 교육 및 실태점검 이행
            "1.0": "교육 및 점검 100% 이행",
            "0.8": "교육 및 점검 90% 이상 이행",
            "0.6": "교육 및 점검 80% 이상 이행",
            "0.4": "교육 및 점검 70% 이상 이행",
            "0.2": "교육 및 점검 70% 미만 이행",
        },
        14: {  # 정보 대외유출 위반건수
            "1.0": "위반건수 0건",
            "0.8": "위반건수 1건",
            "0.6": "위반건수 2건",
            "0.4": "위반건수 3건",
            "0.2": "위반건수 4건 이상",
        },
    }

    created_count = 0
    items = SLAEvaluationItem.objects.filter(
        category__contract=contract
    ).select_related("category")

    for item in items:
        item_criteria = CRITERIA.get(item.item_number, {})
        for level_str, text in item_criteria.items():
            _, created = SLAEvaluationCriteria.objects.get_or_create(
                evaluation_item=item,
                service_level=Decimal(level_str),
                defaults={"criteria_text": text},
            )
            if created:
                created_count += 1

    print(f"Created {created_count} evaluation criteria for contract: {contract.name}")
    return created_count


def seed_equipment_importance(contract_id):
    """Seed equipment importance grades based on Article 7.

    Default mapping:
    - A grade: Core servers (DB, web, app servers), core network equipment
    - B grade: Secondary servers, security devices
    - C grade: PCs, peripherals, other
    """
    from equipments.models import Equipment
    from contracts.models import Contract

    contract = Contract.objects.get(id=contract_id)
    equipments = Equipment.objects.filter(contract=contract)

    CATEGORY_GRADE_MAP = {
        "server": "A",
        "network": "A",
        "storage": "B",
        "security": "B",
        "pc": "C",
        "other": "C",
    }

    updated_count = 0
    for eq in equipments:
        grade = CATEGORY_GRADE_MAP.get(eq.category, "C")
        if eq.importance_grade != grade:
            eq.importance_grade = grade
            Equipment.objects.filter(pk=eq.pk).update(importance_grade=grade)
            updated_count += 1

    print(
        f"Updated {updated_count} equipment importance grades for contract: {contract.name}"
    )
    return updated_count


def seed_sla_definitions(contract_id):
    """Seed SLA definitions based on KRIHS standard.

    Creates SLA targets for:
    - 장애대응 (Incident Response): 4 priorities based on severity/importance grade
      - Critical (심각도1): 즉시 대응, A등급 복구목표 2시간
      - High (심각도2): 30분 대응, B등급 복구목표 4시간
      - Medium (심각도3): 1시간 대응, C등급 복구목표 8시간
      - Low: 4시간 대응, 24시간 복구
    - 서비스 요청 처리 (Service Request): Article 10 기준
      - 단순요청: 72시간
      - 변경요청: 168시간 (7일)
      - 교체요청: 336시간 (14일)
    - 정기점검 (Regular Maintenance): 월 1회, 보고서 3일 이내
    - 보안 사고 대응 (Security Incident): 즉시 대응, 4시간 해결
    - 백업/복구 (Backup & Recovery): 일일 백업, 4시간 복구
    """
    from sla.models import SLADefinition
    from contracts.models import Contract

    contract = Contract.objects.get(id=contract_id)

    DEFINITIONS = [
        # === 장애대응 (Incident Response) - Article 9 ===
        {
            "service_type": "장애대응",
            "priority": "critical",
            "target_response_time_minutes": 10,
            "target_resolution_time_minutes": 120,  # A등급 복구목표 2시간
            "description": "심각도1: 전체 시스템 장애, 핵심 업무 중단. A등급 장비 복구목표 2시간 이내. 즉시 대응 후 원인분석 보고서 4시간 이내 작성.",
        },
        {
            "service_type": "장애대응",
            "priority": "high",
            "target_response_time_minutes": 30,
            "target_resolution_time_minutes": 240,  # B등급 복구목표 4시간
            "description": "심각도2: 주요 서비스 장애, 일부 업무 영향. B등급 장비 복구목표 4시간 이내. 30분 이내 대응.",
        },
        {
            "service_type": "장애대응",
            "priority": "medium",
            "target_response_time_minutes": 60,
            "target_resolution_time_minutes": 480,  # C등급 복구목표 8시간
            "description": "심각도3: 개별 시스템 장애, 업무 일부 지연. C등급 장비 복구목표 8시간 이내. 1시간 이내 대응.",
        },
        {
            "service_type": "장애대응",
            "priority": "low",
            "target_response_time_minutes": 240,
            "target_resolution_time_minutes": 1440,  # 24시간
            "description": "경미한 장애, 대체수단 가용. 4시간 이내 대응, 24시간 이내 복구.",
        },
        # === 서비스 요청 처리 (Service Request) - Article 10 ===
        {
            "service_type": "서비스요청-단순",
            "priority": "low",
            "target_response_time_minutes": 60,
            "target_resolution_time_minutes": 4320,  # 72시간 (3일)
            "description": "단순 서비스 요청: 계정 생성, 권한 변경, 소프트웨어 설치, 설정 변경 등. 접수 후 72시간(3영업일) 이내 처리.",
        },
        {
            "service_type": "서비스요청-변경",
            "priority": "medium",
            "target_response_time_minutes": 60,
            "target_resolution_time_minutes": 10080,  # 168시간 (7일)
            "description": "변경 서비스 요청: 시스템 구성 변경, 네트워크 설정 변경, 보안정책 변경 등. 접수 후 168시간(7영업일) 이내 처리.",
        },
        {
            "service_type": "서비스요청-교체",
            "priority": "medium",
            "target_response_time_minutes": 120,
            "target_resolution_time_minutes": 20160,  # 336시간 (14일)
            "description": "교체 서비스 요청: 장비 교체, 부품 교체, 시스템 이전 등. 접수 후 336시간(14영업일) 이내 처리.",
        },
        # === 정기점검 (Regular Maintenance) - Article 11 ===
        {
            "service_type": "정기점검",
            "priority": "medium",
            "target_response_time_minutes": 0,
            "target_resolution_time_minutes": 43200,  # 30일 (월 1회)
            "description": "월 1회 시스템 정기점검 실시. 점검 결과 보고서 점검 완료 후 3영업일 이내 제출. 서버, 네트워크, 보안장비, SW 전수 점검.",
        },
        # === 보안 사고 대응 (Security Incident) ===
        {
            "service_type": "보안사고대응",
            "priority": "critical",
            "target_response_time_minutes": 10,
            "target_resolution_time_minutes": 240,  # 4시간
            "description": "보안 침해사고 발생 시 즉시 대응. 10분 이내 초동대응, 4시간 이내 차단 및 복구 조치. 24시간 이내 사고분석 보고서 작성.",
        },
        {
            "service_type": "보안사고대응",
            "priority": "high",
            "target_response_time_minutes": 30,
            "target_resolution_time_minutes": 480,  # 8시간
            "description": "보안 이상징후 감지. 30분 이내 확인 대응, 8시간 이내 원인 파악 및 조치 완료.",
        },
        # === 백업/복구 (Backup & Recovery) ===
        {
            "service_type": "백업복구",
            "priority": "high",
            "target_response_time_minutes": 30,
            "target_resolution_time_minutes": 240,  # 4시간 복구
            "description": "일일 백업 수행 및 백업 상태 점검. 데이터 복구 요청 시 4시간 이내 복구 완료. 월 1회 복구 테스트 실시.",
        },
        {
            "service_type": "백업복구",
            "priority": "medium",
            "target_response_time_minutes": 60,
            "target_resolution_time_minutes": 480,  # 8시간
            "description": "비핵심 시스템 백업/복구. 1시간 이내 대응, 8시간 이내 복구 완료.",
        },
    ]

    created_count = 0
    for defn in DEFINITIONS:
        _, created = SLADefinition.objects.get_or_create(
            contract=contract,
            service_type=defn["service_type"],
            priority=defn["priority"],
            defaults={
                "target_response_time_minutes": defn["target_response_time_minutes"],
                "target_resolution_time_minutes": defn["target_resolution_time_minutes"],
                "description": defn["description"],
                "is_active": True,
            },
        )
        if created:
            created_count += 1

    print(f"Created {created_count} SLA definitions for contract: {contract.name}")
    return created_count


if __name__ == "__main__":
    import sys

    print("Usage Examples:")
    print("1. From Django shell:")
    print("   python manage.py shell")
    print("   >>> from sla.seed_evaluation_data import seed_sla_evaluation_data")
    print("   >>> seed_sla_evaluation_data(contract_id=1)")
    print("")
    print("2. Seed criteria (after seeding items):")
    print("   >>> from sla.seed_evaluation_data import seed_evaluation_criteria")
    print("   >>> seed_evaluation_criteria(contract_id=1)")
    print("")
    print("3. Seed equipment importance grades:")
    print("   >>> from sla.seed_evaluation_data import seed_equipment_importance")
    print("   >>> seed_equipment_importance(contract_id=1)")
    print("")
    print("4. Seed SLA definitions (response/resolution targets):")
    print("   >>> from sla.seed_evaluation_data import seed_sla_definitions")
    print("   >>> seed_sla_definitions(contract_id=1)")
    print("")
    print("Note: Replace '1' with actual contract ID")
