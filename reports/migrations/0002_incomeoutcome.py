from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='IncomeOutcome',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('entry_type',  models.CharField(max_length=10, choices=[('income', 'Income'), ('outcome', 'Outcome')])),
                ('amount',      models.DecimalField(max_digits=10, decimal_places=2)),
                ('description', models.CharField(max_length=255, blank=True)),
                ('entry_date',  models.DateField()),
                ('created_at',  models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'income_outcome',
                'ordering': ['-entry_date', '-created_at'],
            },
        ),
    ]
