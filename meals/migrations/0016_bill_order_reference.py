from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0015_notification_order_nullable'),
    ]

    operations = [
        migrations.AddField(
            model_name='bill',
            name='order_reference',
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
    ]
