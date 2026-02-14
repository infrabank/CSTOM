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


if __name__ == "__main__":
    import sys

    print("Usage Examples:")
    print("1. From Django shell:")
    print("   python manage.py shell")
    print("   >>> from sla.seed_evaluation_data import seed_sla_evaluation_data")
    print("   >>> seed_sla_evaluation_data(contract_id=1)")
    print("")
    print("2. Inline:")
    print(
        '   python manage.py shell -c "from sla.seed_evaluation_data import seed_sla_evaluation_data; seed_sla_evaluation_data(1)"'
    )
    print("")
    print("Note: Replace '1' with actual contract ID")
