from django.db import migrations, models


VARIANT_PRIORITY = {
    'standard': 10,
    'regular': 10,
    'plain': 10,
    'single': 10,
    'small': 10,
    'with cheese': 20,
    'double': 20,
    'big': 20,
    'with ice': 20,
    'with nuts': 30,
    'with fruit/nuts': 30,
}


def populate_menu_item_price(apps, schema_editor):
    MenuItem = apps.get_model('pos', 'MenuItem')
    ItemVariant = apps.get_model('pos', 'ItemVariant')

    for item in MenuItem.objects.all().iterator():
        variants = list(ItemVariant.objects.filter(item=item))
        if not variants:
            if not item.price:
                item.price = 0
                item.save(update_fields=['price'])
            continue

        ranked = sorted(
            variants,
            key=lambda variant: (
                VARIANT_PRIORITY.get((variant.name or '').strip().lower(), 999),
                variant.price <= 0,
                variant.id,
            ),
        )
        chosen = ranked[0]
        item.price = chosen.price
        item.save(update_fields=['price'])


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0012_normalize_catalog_seed'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.RunPython(populate_menu_item_price, migrations.RunPython.noop),
    ]
