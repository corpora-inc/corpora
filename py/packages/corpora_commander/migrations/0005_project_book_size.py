from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("corpora_commander", "0004_projectsnapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="book_size",
            field=models.CharField(
                choices=[
                    ("5x8", "5x8"),
                    ("5.25x8", "5.25x8"),
                    ("5.5x8.5", "5.5x8.5"),
                    ("6x9", "6x9"),
                    ("8.5x11", "8.5x11"),
                ],
                default="6x9",
                max_length=16,
            ),
        ),
    ]
