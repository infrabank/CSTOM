# Data migration to fix incorrect approval_required values

from django.db import migrations


def fix_approval_required(apps, schema_editor):
    """Fix tasks where approval_required doesn't match the actual conditions."""
    Task = apps.get_model("tasks", "Task")

    # Fix tasks that should NOT require approval but have approval_required=True
    Task.objects.filter(
        approval_required=True,
    ).exclude(impact_level="full").exclude(task_type="change").update(
        approval_required=False,
        approval_status="not_required",
    )

    # Fix tasks that SHOULD require approval but have approval_required=False
    # Set to pending if not already approved/rejected
    Task.objects.filter(
        approval_required=False,
        impact_level="full",
    ).update(
        approval_required=True,
        approval_status="pending",
    )

    Task.objects.filter(
        approval_required=False,
        task_type="change",
    ).update(
        approval_required=True,
        approval_status="pending",
    )


def reverse_fix(apps, schema_editor):
    """No-op reverse - we can't know the original incorrect state."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0002_add_approval_fields"),
    ]

    operations = [
        migrations.RunPython(fix_approval_required, reverse_fix),
    ]
