from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('meals', '0017_bill_delivery_address_bill_delivery_fee_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='bill',
            name='cashier',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='bills', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='BillSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(choices=[('online', 'Online Order'), ('walk_in', 'Walk-in')], max_length=10)),
                ('sequence_date', models.DateField()),
                ('last_number', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'bill_sequences',
                'unique_together': {('source', 'sequence_date')},
            },
        ),
        migrations.AddIndex(
            model_name='billsequence',
            index=models.Index(fields=['source', 'sequence_date'], name='bill_sequen_source_8d2e3a_idx'),
        ),
    ]
