from django.db import models
from partners.models import Branch


class Event(models.Model):
    STATUS_CHOICES = [
        ('inquiry',   'Inquiry'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    name               = models.CharField(max_length=200)
    customer_name      = models.CharField(max_length=150)
    customer_contact   = models.CharField(max_length=50, blank=True)
    event_date         = models.DateField()
    venue              = models.TextField(blank=True)
    assigned_branch    = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    total_amount       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status             = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inquiry')
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'events'
        indexes  = [
            models.Index(fields=['assigned_branch']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.name
