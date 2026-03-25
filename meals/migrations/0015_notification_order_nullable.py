from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0014_suggestion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='order',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='notifications',
                to='meals.mealorder',
            ),
        ),
    ]
