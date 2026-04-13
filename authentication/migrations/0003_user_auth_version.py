from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_user_deactivation_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='auth_version',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
