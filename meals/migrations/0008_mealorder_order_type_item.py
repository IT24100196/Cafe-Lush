from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0007_seed_meal_packages'),
        ('pos',   '0004_category_cascade_delete'),
    ]

    operations = [
        migrations.AddField(
            model_name='mealorder',
            name='order_type',
            field=models.CharField(
                max_length=10,
                choices=[('package', 'Package'), ('item', 'Item')],
                default='package',
            ),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='item',
            field=models.ForeignKey(
                to='pos.Item',
                on_delete=django.db.models.deletion.PROTECT,
                null=True, blank=True,
                related_name='meal_orders',
            ),
        ),
    ]
