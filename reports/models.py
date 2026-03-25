from django.db import models
from django.utils import timezone


class Payment(models.Model):
    REFERENCE_CHOICES = [('meal', 'Meal'), ('pos', 'POS'), ('event', 'Event')]

    reference_type = models.CharField(max_length=20, choices=REFERENCE_CHOICES)
    reference_id   = models.PositiveIntegerField()
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date   = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'payments'
        indexes  = [models.Index(fields=['reference_type', 'reference_id'])]


class IncomeOutcome(models.Model):
    TYPE_CHOICES = [('income', 'Income'), ('outcome', 'Outcome')]

    entry_type  = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    entry_date  = models.DateField()
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'income_outcome'
        ordering = ['-entry_date', '-created_at']
