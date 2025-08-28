import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("corpora_commander", "0003_projectimage"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectSnapshot",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=200)),
                ("description", models.TextField(blank=True)),
                ("snapshot", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=models.deletion.CASCADE,
                        related_name="snapshots",
                        to="corpora_commander.project",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
