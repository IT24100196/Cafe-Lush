from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_passwordresetotp'),
    ]

    operations = [
        migrations.CreateModel(
            name='PendingStudentRegistration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=254)),
                ('password_hash', models.CharField(max_length=128)),
                ('full_name', models.CharField(max_length=150)),
                ('contact', models.CharField(blank=True, default='', max_length=50)),
                ('otp_hash', models.CharField(max_length=128)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('attempts', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.AddIndex(
            model_name='pendingstudentregistration',
            index=models.Index(fields=['email', 'expires_at'], name='authenticat_email_319c25_idx'),
        ),
        migrations.AddIndex(
            model_name='pendingstudentregistration',
            index=models.Index(fields=['used_at'], name='authenticat_used_at_219fad_idx'),
        ),
    ]
