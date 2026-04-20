from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("meals", "0020_mealorder_status_timestamps"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="bill",
            name="edit_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="bill",
            name="edited_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bill",
            name="edited_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="edited_walkin_bills", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="bill",
            name="original_items",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="bill",
            name="original_total_amount",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
