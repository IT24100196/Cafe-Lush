from django.db import migrations


def normalize_catalog_seed(apps, schema_editor):
    MenuItem = apps.get_model('pos', 'MenuItem')
    ItemVariant = apps.get_model('pos', 'ItemVariant')

    merge_targets = [
        ('Ice Cream', 'Bubblegum', '006Q', '006S'),
        ('Ice Cream', 'Mint', '010Q', '010S'),
        ('Waffle', 'Strawberry', '003V', '003W'),
    ]

    for group_name, normalized_name, keep_code, merge_code in merge_targets:
        keep = MenuItem.objects.filter(menu_group__name=group_name, item_id=keep_code).first()
        merge = MenuItem.objects.filter(menu_group__name=group_name, item_id=merge_code).first()
        if not keep or not merge or keep.pk == merge.pk:
            continue

        keep.name = normalized_name
        keep.save(update_fields=['name'])

        if not keep.image and merge.image:
            keep.image = merge.image
            keep.save(update_fields=['image'])

        existing_variant_names = {variant.name for variant in ItemVariant.objects.filter(item=keep)}
        for variant in ItemVariant.objects.filter(item=merge).order_by('sort_order', 'id'):
            if variant.name in existing_variant_names:
                continue
            variant.item = keep
            variant.save(update_fields=['item'])
            existing_variant_names.add(variant.name)

        merge.delete()

    rename_map = {
        ('Ice Cream', 'bubblegum'): 'Bubblegum',
        ('Ice Cream', 'Bubble gum'): 'Bubblegum',
        ('Ice Cream', 'mint'): 'Mint',
        ('Waffle', 'strawberry'): 'Strawberry',
    }

    for (group_name, old_name), new_name in rename_map.items():
        for item in MenuItem.objects.filter(menu_group__name=group_name, name=old_name):
            if MenuItem.objects.filter(menu_group=item.menu_group, name=new_name).exclude(pk=item.pk).exists():
                continue
            item.name = new_name
            item.save(update_fields=['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0011_catalog_menu_hierarchy'),
    ]

    operations = [
        migrations.RunPython(normalize_catalog_seed, migrations.RunPython.noop),
    ]
