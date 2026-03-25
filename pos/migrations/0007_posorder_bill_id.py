from django.db import migrations, models


def backfill_bill_ids(apps, schema_editor):
    PosOrder = apps.get_model('pos', 'PosOrder')
    for order in PosOrder.objects.filter(bill_id='').order_by('id'):
        date_str = order.created_at.strftime('%Y%m%d')
        order.bill_id = f'BILL-{date_str}-{order.pk:04d}'
        order.save(update_fields=['bill_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0006_weeklymealplan'),
    ]

    operations = [
        # Step 1: add without unique/index so existing rows can be backfilled
        migrations.AddField(
            model_name='posorder',
            name='bill_id',
            field=models.CharField(blank=True, max_length=20, default=''),
            preserve_default=False,
        ),
        # Step 2: backfill existing rows
        migrations.RunPython(backfill_bill_ids, migrations.RunPython.noop),
        # Step 3: add unique + index now that all rows have values
        migrations.AlterField(
            model_name='posorder',
            name='bill_id',
            field=models.CharField(blank=True, db_index=True, max_length=20, unique=True),
        ),
    ]
