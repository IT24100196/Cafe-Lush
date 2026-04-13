from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0018_bill_cashier_billsequence'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mealorder',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('confirmed', 'Confirmed'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
