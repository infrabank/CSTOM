from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("contracts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Equipment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(max_length=255, verbose_name="Equipment Name"),
                ),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("server", "Server"),
                            ("network", "Network Device"),
                            ("storage", "Storage"),
                            ("security", "Security Device"),
                            ("pc", "PC/Workstation"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=20,
                    ),
                ),
                (
                    "serial_number",
                    models.CharField(
                        max_length=100, unique=True, verbose_name="Serial Number"
                    ),
                ),
                (
                    "model_name",
                    models.CharField(blank=True, max_length=255, verbose_name="Model"),
                ),
                (
                    "manufacturer",
                    models.CharField(
                        blank=True, max_length=255, verbose_name="Manufacturer"
                    ),
                ),
                (
                    "location",
                    models.CharField(
                        blank=True, max_length=255, verbose_name="Storage Location"
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("available", "Available"),
                            ("checked_out", "Checked Out"),
                            ("maintenance", "Under Maintenance"),
                            ("retired", "Retired"),
                        ],
                        default="available",
                        max_length=20,
                    ),
                ),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "contract",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="equipments",
                        to="contracts.contract",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="EquipmentTransaction",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "transaction_type",
                    models.CharField(
                        choices=[("check_out", "Check Out"), ("check_in", "Check In")],
                        max_length=20,
                    ),
                ),
                (
                    "handler_name",
                    models.CharField(max_length=100, verbose_name="Handler Name"),
                ),
                (
                    "handler_affiliation",
                    models.CharField(
                        blank=True, max_length=255, verbose_name="Handler Affiliation"
                    ),
                ),
                (
                    "handler_contact",
                    models.CharField(
                        blank=True, max_length=100, verbose_name="Handler Contact"
                    ),
                ),
                ("purpose", models.TextField(blank=True, verbose_name="Purpose")),
                (
                    "expected_return_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Expected Return Date"
                    ),
                ),
                ("transaction_date", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "equipment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transactions",
                        to="equipments.equipment",
                    ),
                ),
            ],
            options={
                "ordering": ["-transaction_date"],
            },
        ),
    ]
