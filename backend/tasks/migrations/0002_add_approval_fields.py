# Generated migration for approval workflow fields

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="approval_status",
            field=models.CharField(
                choices=[
                    ("not_required", "Not Required"),
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("rejected", "Rejected"),
                ],
                default="not_required",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="approved_by",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="task",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
