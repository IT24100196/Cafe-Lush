from django.db import models
from authentication.models import User
from pos.models import Item


class Student(models.Model):
    user         = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_profile')
    student_code = models.CharField(max_length=50, unique=True)
    full_name    = models.CharField(max_length=150)
    contact      = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f'{self.student_code} – {self.full_name}'


class MealType(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    cutoff_time = models.TimeField()

    class Meta:
        db_table = 'meal_types'

    def __str__(self):
        return self.name


class MealOrder(models.Model):
    ORDER_TYPE_CHOICES = [
        ('package', 'Package'),
        ('item',    'Item'),
    ]
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    DELIVERY_CHOICES = [
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
    ]

    student          = models.ForeignKey(Student,  on_delete=models.PROTECT, related_name='orders')
    meal_type        = models.ForeignKey(MealType, on_delete=models.PROTECT, related_name='orders', null=True, blank=True)
    item             = models.ForeignKey(Item,     on_delete=models.PROTECT, related_name='meal_orders', null=True, blank=True)
    order_type       = models.CharField(max_length=10, choices=ORDER_TYPE_CHOICES, default='package')
    order_date       = models.DateField()
    delivery_type    = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='takeaway')
    quantity         = models.PositiveIntegerField(default=1)
    delivery_address = models.TextField(blank=True, default='')
    phone_number     = models.CharField(max_length=20, blank=True, default='')
    student_email    = models.EmailField(blank=True, default='')
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    session_id       = models.CharField(max_length=36, blank=True, default='', db_index=True)
    preference       = models.CharField(max_length=10, blank=True, default='',
                           choices=[('veg', 'Veg'), ('non-veg', 'Non-Veg')])
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meal_orders'
        indexes  = [
            models.Index(fields=['student']),
            models.Index(fields=['meal_type']),
            models.Index(fields=['status']),
        ]


class Notification(models.Model):
    student   = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications')
    order     = models.ForeignKey(MealOrder, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message   = models.TextField()
    is_read   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class Bill(models.Model):
    SOURCE_CHOICES = [
        ('online',   'Online Order'),
        ('walk_in',  'Walk-in'),
    ]

    meal_order    = models.OneToOneField(MealOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='bill')
    bill_number   = models.CharField(max_length=30, unique=True)
    source        = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='online')
    customer_name = models.CharField(max_length=150, blank=True, default='')
    items         = models.JSONField(default=list)   # [{name, qty, unit_price, line_total}]
    total_amount  = models.DecimalField(max_digits=10, decimal_places=2)
    sent_to_email = models.EmailField(blank=True, default='')
    generated_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bills'
        ordering = ['-generated_at']

    def __str__(self):
        return self.bill_number


class Suggestion(models.Model):
    student    = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='suggestions')
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'suggestions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Suggestion by {self.student} at {self.created_at}'


class MealPackage(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'),
        (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    meal_type   = models.ForeignKey(MealType, on_delete=models.PROTECT, related_name='packages')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    is_veg      = models.BooleanField(default=True)
    items       = models.ManyToManyField(Item, blank=True, related_name='meal_packages')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meal_packages'
        unique_together = [('meal_type', 'day_of_week')]
        ordering = ['day_of_week', 'meal_type']
