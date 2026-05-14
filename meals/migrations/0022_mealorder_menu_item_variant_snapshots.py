from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0013_menuitem_price'),
        ('meals', '0021_bill_edit_tracking'),
    ]

    operations = [
        migrations.AddField(
            model_name='mealorder',
            name='item_name_snapshot',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='item_price_snapshot',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='item_variant',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='student_orders', to='pos.itemvariant'),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='menu_item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='student_orders', to='pos.menuitem'),
        ),
    ]
