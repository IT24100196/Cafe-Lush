from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0012_mealorder_session_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='mealorder',
            name='preference',
            field=models.CharField(
                blank=True, default='',
                choices=[('veg', 'Veg'), ('non-veg', 'Non-Veg')],
                max_length=10,
            ),
        ),
    ]
