from django.db import models
from django.utils import timezone
from authentication.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name


class Item(models.Model):
    item_id      = models.CharField(max_length=50, blank=True, default='')
    category     = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name         = models.CharField(max_length=150)
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    image        = models.ImageField(upload_to='items/', null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'items'
        indexes  = [
            models.Index(fields=['category']),
            models.Index(fields=['is_available']),
        ]

    def __str__(self):
        return self.name


class PosOrder(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('paid', 'Paid'), ('voided', 'Voided')]

    cashier      = models.ForeignKey(User, on_delete=models.PROTECT, related_name='pos_orders')
    bill_id      = models.CharField(max_length=20, unique=True, blank=True, db_index=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pos_orders'
        indexes  = [
            models.Index(fields=['cashier']),
            models.Index(fields=['status']),
        ]

    def save(self, *args, **kwargs):
        if not self.bill_id:
            super().save(*args, **kwargs)
            date_str = timezone.localdate().strftime('%Y%m%d')
            self.bill_id = f'BILL-{date_str}-{self.pk:04d}'
            kwargs.pop('force_insert', None)
            super().save(update_fields=['bill_id'], **kwargs)
        else:
            super().save(*args, **kwargs)


class PosOrderItem(models.Model):
    pos_order  = models.ForeignKey(PosOrder, on_delete=models.CASCADE, related_name='order_items')
    item       = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity   = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pos_order_items'
        indexes  = [models.Index(fields=['pos_order']), models.Index(fields=['item'])]


class WeeklyMealPlan(models.Model):
    MEAL_TIME_CHOICES = [
        ('breakfast', 'Breakfast'),
        ('lunch',     'Lunch'),
        ('dinner',    'Dinner'),
    ]
    MEAL_CATEGORY_CHOICES = [
        ('veg',    'Veg'),
        ('nonveg', 'Non-Veg'),
    ]

    day_of_week   = models.PositiveSmallIntegerField()  # 0=Mon … 6=Sun
    meal_time     = models.CharField(max_length=20, choices=MEAL_TIME_CHOICES)
    meal_category = models.CharField(max_length=20, choices=MEAL_CATEGORY_CHOICES)
    dishes        = models.JSONField(default=list)
    price         = models.DecimalField(max_digits=8, decimal_places=2, default=200)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'weekly_meal_plan'
        unique_together = ('day_of_week', 'meal_time', 'meal_category')
        ordering = ['day_of_week', 'meal_time', 'meal_category']

    def __str__(self):
        return f"Day {self.day_of_week} {self.meal_time} {self.meal_category}"


class FeaturedItem(models.Model):
    item     = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='featured')
    position = models.PositiveSmallIntegerField(unique=True)  # 1–4
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'featured_items'
        ordering = ['position']

    def __str__(self):
        return f"Slot {self.position} — {self.item.name}"
