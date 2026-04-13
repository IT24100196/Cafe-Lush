from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("pos", "0007_posorder_bill_id"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE public.items
                ADD COLUMN IF NOT EXISTS item_id varchar(50) NOT NULL DEFAULT '';
            """,
            reverse_sql="""
                ALTER TABLE public.items
                DROP COLUMN IF EXISTS item_id;
            """,
        ),
    ]

