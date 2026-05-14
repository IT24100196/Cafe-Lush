from django.db import migrations, models
import django.db.models.deletion


def seed_catalog_menu_hierarchy(apps, schema_editor):
    Category = apps.get_model('pos', 'Category')
    Item = apps.get_model('pos', 'Item')
    CatalogCategory = apps.get_model('pos', 'CatalogCategory')
    MenuGroup = apps.get_model('pos', 'MenuGroup')
    MenuItem = apps.get_model('pos', 'MenuItem')
    ItemVariant = apps.get_model('pos', 'ItemVariant')

    category_sort = {
        'Meals': 10,
        'Soups': 20,
        'Breakfast & Toast': 30,
        'Healthy': 40,
        'Specials': 50,
        'Drinks': 60,
        'Desserts': 70,
        'Quick Bites': 80,
    }
    group_sort = {
        ('Meals', 'Veg Meals'): 10,
        ('Meals', 'Non-Veg Meals'): 20,
        ('Meals', 'Light Meals'): 30,
        ('Soups', 'Veg Soups'): 10,
        ('Soups', 'Non-Veg Soups'): 20,
        ('Breakfast & Toast', 'Sandwiches'): 10,
        ('Breakfast & Toast', 'Bread Toast'): 20,
        ('Breakfast & Toast', 'Egg Appam'): 30,
        ('Healthy', 'Salads'): 10,
        ('Healthy', 'Healthy Snacks'): 20,
        ('Specials', 'Daily Specials'): 10,
        ('Drinks', 'Hot Blend'): 10,
        ('Drinks', 'Natural Coolers'): 20,
        ('Drinks', 'Cold Blend'): 30,
        ('Drinks', 'Boba Coolers'): 40,
        ('Drinks', 'Shakes'): 50,
        ('Desserts', 'Gel Dessert'): 10,
        ('Desserts', 'Ice Cream'): 20,
        ('Desserts', 'Waffle'): 30,
        ('Quick Bites', 'Quick Bites'): 10,
    }
    variant_priority = {
        'Standard': 10,
        'Regular': 10,
        'Plain': 10,
        'Single': 10,
        'Small': 10,
        'With Cheese': 20,
        'Double': 20,
        'Big': 20,
        'With Ice': 20,
        'With Nuts': 30,
        'With Fruit/Nuts': 30,
    }
    item_name_fixes = {
        'Vanila': 'Vanilla',
        'Bluberry': 'Blueberry',
        'Buleberry': 'Blueberry',
        'Starowberry': 'Strawberry',
        'Khittul': 'Kithul',
        'Panner': 'Paneer',
        'Tost': 'Toast',
        'Noodils': 'Noodles',
        'Noodels': 'Noodles',
    }

    def clean_spaces(value):
        return ' '.join((value or '').replace('\t', ' ').split())

    def fix_item_name(name):
        value = clean_spaces(name)
        for old, new in item_name_fixes.items():
            value = value.replace(old, new)
        return value.strip()

    def strip_suffix(value, suffix):
        lower = value.lower()
        if lower.endswith(suffix.lower()):
            value = value[:len(value) - len(suffix)]
        return clean_spaces(value)

    def normalize_catalog_target(category_name, item_name):
        category_name = clean_spaces(category_name)
        item_name = fix_item_name(item_name)

        if category_name.startswith('Vege Food'):
            return ('Meals', 'Veg Meals', item_name, 'Standard')
        if category_name.startswith('Non Veg Food'):
            return ('Meals', 'Non-Veg Meals', item_name, 'Standard')
        if category_name.startswith('Light Meals'):
            return ('Meals', 'Light Meals', item_name, 'Standard')
        if category_name.startswith("Shantha's Special Daily"):
            return ('Specials', 'Daily Specials', item_name, 'Standard')
        if category_name.startswith('Veg Soup'):
            return ('Soups', 'Veg Soups', item_name, 'Standard')
        if category_name.startswith('Non Veg Soup'):
            return ('Soups', 'Non-Veg Soups', item_name, 'Standard')
        if category_name.startswith('Salads'):
            return ('Healthy', 'Salads', item_name, 'Standard')
        if category_name.startswith('Healthy Snacks'):
            return ('Healthy', 'Healthy Snacks', item_name, 'Standard')
        if category_name.startswith('Hot Blend'):
            return ('Drinks', 'Hot Blend', item_name, 'Standard')
        if category_name.startswith('Natural Coolers'):
            return ('Drinks', 'Natural Coolers', item_name, 'Standard')
        if category_name.startswith('Cold Blend'):
            return ('Drinks', 'Cold Blend', item_name, 'Standard')
        if category_name.startswith('Boba Coolers'):
            return ('Drinks', 'Boba Coolers', item_name, 'Standard')
        if category_name.startswith('Gel Dessert'):
            return ('Desserts', 'Gel Dessert', item_name, 'Standard')
        if category_name.startswith('Ice cream('):
            if 'single' in category_name.lower():
                variant = 'Single'
                base_name = strip_suffix(item_name, 'ice cream(single)')
            elif 'double' in category_name.lower():
                variant = 'Double'
                base_name = strip_suffix(item_name, 'ice cream(Double)')
            else:
                variant = 'With Nuts'
                base_name = strip_suffix(item_name, 'ice cream with nuts')
                base_name = strip_suffix(base_name, 'ice cream (with nuts)')
            return ('Desserts', 'Ice Cream', fix_item_name(base_name), variant)
        if category_name.startswith('Shacks'):
            if 'with ice' in category_name.lower():
                variant = 'With Ice'
                base_name = strip_suffix(item_name, 'shacks (with ice)')
            else:
                variant = 'Regular'
                base_name = strip_suffix(item_name, '(shacks)')
            return ('Drinks', 'Shakes', fix_item_name(base_name), variant)
        if category_name.startswith('Honecomb Cake'):
            if 'with fruit/nuts' in category_name.lower():
                variant = 'With Fruit/Nuts'
                base_name = strip_suffix(item_name, 'Waffle(with fruit/nuts)')
            elif 'with ice' in category_name.lower():
                variant = 'With Ice'
                base_name = strip_suffix(item_name, 'Waffle(with ice)')
            else:
                variant = 'Plain'
                base_name = strip_suffix(item_name, 'Waffle')
            return ('Desserts', 'Waffle', fix_item_name(base_name), variant)
        if category_name.startswith('Quick Bites'):
            if 'small size' in category_name.lower():
                variant = 'Small'
                base_name = strip_suffix(item_name, '(small size)')
            else:
                variant = 'Big'
                base_name = strip_suffix(item_name, '(Big size)')
            return ('Quick Bites', 'Quick Bites', fix_item_name(base_name), variant)
        if category_name.startswith('Sandwich'):
            lower = item_name.lower()
            if 'with cheese' in lower:
                return ('Breakfast & Toast', 'Sandwiches', fix_item_name(strip_suffix(item_name, 'with Cheese')), 'With Cheese')
            return ('Breakfast & Toast', 'Sandwiches', item_name, 'Standard')
        if category_name.startswith('Veg Bread Tost'):
            lower = item_name.lower()
            if 'with cheese' in lower:
                return ('Breakfast & Toast', 'Bread Toast', fix_item_name(strip_suffix(item_name, 'with Cheese')), 'With Cheese')
            return ('Breakfast & Toast', 'Bread Toast', item_name, 'Standard')
        if category_name.startswith('Egg Appam'):
            return ('Breakfast & Toast', 'Egg Appam', item_name, 'Standard')
        return ('Meals', category_name, item_name, 'Standard')

    grouped = {}
    legacy_items = (
        Item.objects
        .select_related('category')
        .filter(category__is_active=True)
        .order_by('category_id', 'item_id', 'id')
    )

    for legacy in legacy_items:
        catalog_name, group_name, item_name, variant_name = normalize_catalog_target(legacy.category.name, legacy.name)
        if not item_name:
            item_name = fix_item_name(legacy.name)
        key = (catalog_name, group_name, item_name)
        grouped.setdefault(key, []).append({
            'item_id': clean_spaces(legacy.item_id),
            'image': getattr(legacy.image, 'name', '') or '',
            'is_available': bool(legacy.is_available),
            'variant_name': variant_name,
            'price': legacy.price,
            'legacy_id': legacy.id,
        })

    catalog_cache = {}
    menu_group_cache = {}

    for catalog_name in sorted({key[0] for key in grouped.keys()}, key=lambda name: (category_sort.get(name, 999), name)):
        catalog_cache[catalog_name], _ = CatalogCategory.objects.get_or_create(
            name=catalog_name,
            defaults={
                'sort_order': category_sort.get(catalog_name, 999),
                'is_active': True,
            },
        )

    for _, group_name, _ in sorted(grouped.keys(), key=lambda key: (category_sort.get(key[0], 999), group_sort.get((key[0], key[1]), 999), key[1], key[2])):
        pass

    created_items = set()
    for key in sorted(grouped.keys(), key=lambda row: (category_sort.get(row[0], 999), group_sort.get((row[0], row[1]), 999), row[2])):
        catalog_name, group_name, item_name = key
        if (catalog_name, group_name) not in menu_group_cache:
            menu_group_cache[(catalog_name, group_name)], _ = MenuGroup.objects.get_or_create(
                category=catalog_cache[catalog_name],
                name=group_name,
                defaults={
                    'sort_order': group_sort.get((catalog_name, group_name), 999),
                    'is_active': True,
                },
            )

        rows = grouped[key]
        primary = sorted(
            rows,
            key=lambda row: (
                variant_priority.get(row['variant_name'], 999),
                row['item_id'] == '',
                row['item_id'],
                row['legacy_id'],
            ),
        )[0]

        menu_item, _ = MenuItem.objects.get_or_create(
            item_id=primary['item_id'] or f'CAT-{primary["legacy_id"]}',
            defaults={
                'menu_group': menu_group_cache[(catalog_name, group_name)],
                'name': item_name,
                'image': primary['image'],
                'is_available': any(row['is_available'] for row in rows),
                'sort_order': primary['legacy_id'],
            },
        )
        if menu_item.pk not in created_items:
            menu_item.menu_group = menu_group_cache[(catalog_name, group_name)]
            menu_item.name = item_name
            menu_item.image = primary['image']
            menu_item.is_available = any(row['is_available'] for row in rows)
            menu_item.sort_order = primary['legacy_id']
            menu_item.save(update_fields=['menu_group', 'name', 'image', 'is_available', 'sort_order'])
            created_items.add(menu_item.pk)

        seen_variants = set()
        for row in sorted(rows, key=lambda entry: (variant_priority.get(entry['variant_name'], 999), entry['legacy_id'])):
            if row['variant_name'] in seen_variants:
                continue
            seen_variants.add(row['variant_name'])
            ItemVariant.objects.get_or_create(
                item=menu_item,
                name=row['variant_name'],
                defaults={
                    'price': row['price'],
                    'is_active': row['is_available'],
                    'sort_order': variant_priority.get(row['variant_name'], 999),
                },
            )


class Migration(migrations.Migration):

    dependencies = [
        ('pos', '0010_category_is_active'),
    ]

    operations = [
        migrations.CreateModel(
            name='CatalogCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
            ],
            options={
                'db_table': 'catalog_categories',
                'ordering': ['sort_order', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='MenuGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('description', models.TextField(blank=True, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='menu_groups', to='pos.catalogcategory')),
            ],
            options={
                'db_table': 'menu_groups',
                'ordering': ['sort_order', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='MenuItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_id', models.CharField(max_length=50)),
                ('name', models.CharField(max_length=150)),
                ('image', models.ImageField(blank=True, null=True, upload_to='items/')),
                ('is_available', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('menu_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='pos.menugroup')),
            ],
            options={
                'db_table': 'menu_items',
                'ordering': ['sort_order', 'name', 'id'],
            },
        ),
        migrations.CreateModel(
            name='ItemVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='pos.menuitem')),
            ],
            options={
                'db_table': 'item_variants',
                'ordering': ['sort_order', 'name', 'id'],
            },
        ),
        migrations.AddConstraint(
            model_name='menugroup',
            constraint=models.UniqueConstraint(fields=('category', 'name'), name='uniq_menu_group_per_catalog_category'),
        ),
        migrations.AddIndex(
            model_name='menuitem',
            index=models.Index(fields=['menu_group'], name='menu_items_menu_gr_7f8a39_idx'),
        ),
        migrations.AddIndex(
            model_name='menuitem',
            index=models.Index(fields=['is_available'], name='menu_items_is_avai_767bcb_idx'),
        ),
        migrations.AddConstraint(
            model_name='menuitem',
            constraint=models.UniqueConstraint(fields=('item_id',), name='uniq_menu_item_code'),
        ),
        migrations.AddConstraint(
            model_name='menuitem',
            constraint=models.UniqueConstraint(fields=('menu_group', 'name'), name='uniq_menu_item_name_per_group'),
        ),
        migrations.AddIndex(
            model_name='itemvariant',
            index=models.Index(fields=['item'], name='item_varian_item_id_8ee62f_idx'),
        ),
        migrations.AddIndex(
            model_name='itemvariant',
            index=models.Index(fields=['is_active'], name='item_varian_is_acti_6f4d6a_idx'),
        ),
        migrations.AddConstraint(
            model_name='itemvariant',
            constraint=models.UniqueConstraint(fields=('item', 'name'), name='uniq_variant_name_per_item'),
        ),
        migrations.RunPython(seed_catalog_menu_hierarchy, migrations.RunPython.noop),
    ]
