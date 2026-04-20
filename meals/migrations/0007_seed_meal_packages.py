from django.db import migrations


# ── Mock data ─────────────────────────────────────────────────────────────────
# Categories → Items
CATEGORIES_ITEMS = {
    'Rice & Curry': [
        ('White Rice',              180.00),
        ('Red Rice',                190.00),
        ('Dhal Curry',              80.00),
        ('Chicken Curry',           220.00),
        ('Fish Curry',              240.00),
        ('Egg Curry',               120.00),
        ('Pumpkin Curry',           70.00),
        ('Beetroot Curry',          70.00),
        ('Potato Curry',            80.00),
        ('Jackfruit Curry',         90.00),
        ('Mutton Curry',            280.00),
        ('Prawn Curry',             300.00),
        ('Pol Sambol',              50.00),
        ('Seeni Sambol',            60.00),
        ('Papadam',                 30.00),
    ],
    'Breakfast Items': [
        ('String Hoppers',          120.00),
        ('Hoppers (Plain)',          60.00),
        ('Egg Hoppers',             90.00),
        ('Pittu',                   110.00),
        ('Roti',                    50.00),
        ('Bread',                   40.00),
        ('Butter',                  30.00),
        ('Jam',                     30.00),
        ('Boiled Egg',              60.00),
        ('Omelette',                90.00),
        ('Kiri Hodi',               70.00),
        ('Coconut Milk Gravy',      70.00),
        ('Lunu Miris',              40.00),
        ('Kade Paan',               35.00),
    ],
    'Soups & Sides': [
        ('Vegetable Soup',          120.00),
        ('Chicken Soup',            160.00),
        ('Lentil Soup',             110.00),
        ('Parippu (Dhal)',          80.00),
        ('Mallum (Greens)',         70.00),
        ('Tempered Potatoes',       90.00),
        ('Fried Papadam',           35.00),
        ('Raita',                   60.00),
    ],
    'Beverages': [
        ('Plain Tea',               60.00),
        ('Milk Tea',                80.00),
        ('Black Coffee',            70.00),
        ('Milo',                    90.00),
        ('Fresh Juice',             120.00),
        ('Water Bottle',            50.00),
    ],
    'Desserts': [
        ('Watalappan',              150.00),
        ('Curd & Treacle',          130.00),
        ('Fruit Salad',             120.00),
        ('Banana',                  40.00),
        ('Pineapple Slice',         60.00),
    ],
}

# 14 packages: (day 0-6, meal_type_name, package_name, description, is_veg, [item_names])
PACKAGES = [
    # ── MONDAY ────────────────────────────────────────────────────────────────
    (0, 'Breakfast', 'Monday Veg Breakfast',
     'A wholesome Sri Lankan veg breakfast to start the week — string hoppers with dhal and coconut milk gravy.',
     True,
     ['String Hoppers', 'Dhal Curry', 'Coconut Milk Gravy', 'Pol Sambol', 'Milk Tea']),

    (0, 'Dinner', 'Monday Veg Dinner',
     'Comforting Monday dinner — red rice with a selection of fresh vegetable curries.',
     True,
     ['Red Rice', 'Dhal Curry', 'Pumpkin Curry', 'Mallum (Greens)', 'Pol Sambol', 'Papadam', 'Plain Tea']),

    # ── TUESDAY ───────────────────────────────────────────────────────────────
    (1, 'Breakfast', 'Tuesday Veg Breakfast',
     'Light and nutritious — plain hoppers with kiri hodi and a boiled egg.',
     True,
     ['Hoppers (Plain)', 'Kiri Hodi', 'Boiled Egg', 'Lunu Miris', 'Plain Tea']),

    (1, 'Dinner', 'Tuesday Veg Dinner',
     'White rice with beetroot curry, potato curry and a warm lentil soup.',
     True,
     ['White Rice', 'Beetroot Curry', 'Potato Curry', 'Lentil Soup', 'Papadam', 'Water Bottle']),

    # ── WEDNESDAY ─────────────────────────────────────────────────────────────
    (2, 'Breakfast', 'Wednesday Veg Breakfast',
     'Midweek energy boost — pittu with dhal curry and fresh coconut milk gravy.',
     True,
     ['Pittu', 'Dhal Curry', 'Coconut Milk Gravy', 'Banana', 'Milk Tea']),

    (2, 'Dinner', 'Wednesday Veg Dinner',
     'Red rice with jackfruit curry, tempered potatoes and a refreshing raita.',
     True,
     ['Red Rice', 'Jackfruit Curry', 'Tempered Potatoes', 'Raita', 'Pol Sambol', 'Plain Tea']),

    # ── THURSDAY ──────────────────────────────────────────────────────────────
    (3, 'Breakfast', 'Thursday Veg Breakfast',
     'Egg hoppers with seeni sambol and a warm cup of Milo — a classic Sri Lankan morning.',
     True,
     ['Egg Hoppers', 'Seeni Sambol', 'Pol Sambol', 'Milo']),

    (3, 'Dinner', 'Thursday Veg Dinner',
     'White rice with egg curry, pumpkin curry and a hearty vegetable soup.',
     True,
     ['White Rice', 'Egg Curry', 'Pumpkin Curry', 'Vegetable Soup', 'Papadam', 'Water Bottle']),

    # ── FRIDAY ────────────────────────────────────────────────────────────────
    (4, 'Breakfast', 'Friday Veg Breakfast',
     'End the weekday right — roti with dhal curry, pol sambol and fresh juice.',
     True,
     ['Roti', 'Dhal Curry', 'Pol Sambol', 'Fresh Juice']),

    (4, 'Dinner', 'Friday Veg Dinner',
     'Red rice with potato curry, mallum and watalappan for a sweet finish.',
     True,
     ['Red Rice', 'Potato Curry', 'Mallum (Greens)', 'Parippu (Dhal)', 'Watalappan', 'Plain Tea']),

    # ── SATURDAY ──────────────────────────────────────────────────────────────
    (5, 'Breakfast', 'Saturday Non-Veg Breakfast',
     'Weekend treat — string hoppers with chicken curry and a creamy coconut milk gravy.',
     False,
     ['String Hoppers', 'Chicken Curry', 'Coconut Milk Gravy', 'Pol Sambol', 'Milk Tea']),

    (5, 'Dinner', 'Saturday Non-Veg Dinner',
     'Special Saturday dinner — white rice with fish curry, prawn curry and curd & treacle dessert.',
     False,
     ['White Rice', 'Fish Curry', 'Prawn Curry', 'Pol Sambol', 'Papadam', 'Curd & Treacle', 'Plain Tea']),

    # ── SUNDAY ────────────────────────────────────────────────────────────────
    (6, 'Breakfast', 'Sunday Non-Veg Breakfast',
     'Lazy Sunday breakfast — egg hoppers with chicken soup and fresh juice.',
     False,
     ['Egg Hoppers', 'Chicken Soup', 'Seeni Sambol', 'Fresh Juice']),

    (6, 'Dinner', 'Sunday Non-Veg Dinner',
     'Grand Sunday dinner — red rice with mutton curry, fish curry and watalappan to close the week.',
     False,
     ['Red Rice', 'Mutton Curry', 'Fish Curry', 'Pol Sambol', 'Papadam', 'Watalappan', 'Milk Tea']),
]


def seed_packages(apps, schema_editor):
    Category   = apps.get_model('pos',   'Category')
    Item       = apps.get_model('pos',   'Item')
    MealType   = apps.get_model('meals', 'MealType')
    MealPackage = apps.get_model('meals', 'MealPackage')

    # 1. Ensure categories + items exist (get_or_create so re-running is safe)
    item_map = {}
    for cat_name, items in CATEGORIES_ITEMS.items():
        cat, _ = Category.objects.get_or_create(name=cat_name)
        for item_name, price in items:
            obj, _ = Item.objects.get_or_create(
                name=item_name,
                defaults={'category': cat, 'price': price, 'is_available': True},
            )
            item_map[item_name] = obj

    # 2. Ensure Breakfast, Lunch, and Dinner meal types exist
    breakfast, _ = MealType.objects.get_or_create(
        name='Breakfast', defaults={'cutoff_time': '20:00'}
    )
    lunch, _ = MealType.objects.get_or_create(
        name='Lunch', defaults={'cutoff_time': '10:00'}
    )
    dinner, _ = MealType.objects.get_or_create(
        name='Dinner', defaults={'cutoff_time': '12:00'}
    )
    type_map = {'Breakfast': breakfast, 'Lunch': lunch, 'Dinner': dinner}

    # 3. Create packages
    for day, meal_type_name, name, desc, is_veg, item_names in PACKAGES:
        pkg, _ = MealPackage.objects.get_or_create(
            meal_type=type_map[meal_type_name],
            day_of_week=day,
            defaults={'name': name, 'description': desc, 'is_veg': is_veg},
        )
        for iname in item_names:
            if iname in item_map:
                pkg.items.add(item_map[iname])


def unseed_packages(apps, schema_editor):
    MealPackage = apps.get_model('meals', 'MealPackage')
    MealPackage.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('meals', '0006_mealpackage'),
    ]

    operations = [
        migrations.RunPython(seed_packages, unseed_packages),
    ]
