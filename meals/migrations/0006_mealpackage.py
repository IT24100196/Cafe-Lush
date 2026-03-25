from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0005_notification'),
        ('pos', '0003_item_item_id'),
    ]

    operations = [
        migrations.CreateModel(
            name='MealPackage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.IntegerField(choices=[
                    (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
                    (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
                ])),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, default='')),
                ('is_veg', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('meal_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='packages', to='meals.mealtype')),
                ('items', models.ManyToManyField(blank=True, related_name='meal_packages', to='pos.item')),
            ],
            options={
                'db_table': 'meal_packages',
                'ordering': ['day_of_week', 'meal_type'],
                'unique_together': {('meal_type', 'day_of_week')},
            },
        ),
    ]
