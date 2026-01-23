from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("corpora_commander", "0005_project_book_size"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="font_size",
            field=models.DecimalField(
                decimal_places=2,
                default=11.0,
                max_digits=5,
            ),
        ),
    ]
