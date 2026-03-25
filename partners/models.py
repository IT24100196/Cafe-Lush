from django.db import models


class Branch(models.Model):
    name            = models.CharField(max_length=150)
    address         = models.TextField(blank=True)
    contact         = models.CharField(max_length=50, blank=True)
    is_partner      = models.BooleanField(default=False)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = 'branches'
        indexes  = [models.Index(fields=['is_partner'])]

    def __str__(self):
        return self.name


class PartnerTransaction(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('paid', 'Paid'), ('cancelled', 'Cancelled')]

    branch            = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='transactions')
    event             = models.OneToOneField('events.Event', on_delete=models.PROTECT, related_name='partner_transaction')
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'partner_transactions'
        indexes  = [
            models.Index(fields=['branch']),
            models.Index(fields=['event']),
            models.Index(fields=['status']),
        ]
