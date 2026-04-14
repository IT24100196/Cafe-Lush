from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0019_alter_mealorder_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='mealorder',
            name='cashier_received_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='confirmed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='completed_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='mealorder',
            name='cancelled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
