from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("pos", "0008_sync_item_id_column"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE public.items
                ADD COLUMN IF NOT EXISTS image varchar(100);
            """,
            reverse_sql="""
                ALTER TABLE public.items
                DROP COLUMN IF EXISTS image;
            """,
        ),
    ]

