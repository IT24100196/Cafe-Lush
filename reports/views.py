from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime

from authentication.permissions import IsAdmin
from meals.models import MealOrder, Bill
from pos.models import PosOrder
from events.models import Event
from partners.models import Branch, PartnerTransaction
from .models import Payment, IncomeOutcome


class IncomeOutcomeListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = IncomeOutcome.objects.all()
        data = [{
            'id':          e.id,
            'entry_type':  e.entry_type,
            'amount':      str(e.amount),
            'description': e.description,
            'entry_date':  str(e.entry_date),
            'created_at':  e.created_at.isoformat(),
        } for e in qs]
        return Response(data)

    def post(self, request):
        d = request.data
        entry_type  = d.get('entry_type')
        amount      = d.get('amount')
        description = d.get('description', '')
        entry_date  = d.get('entry_date')

        if entry_type not in ('income', 'outcome'):
            return Response({'detail': 'entry_type must be income or outcome.'}, status=400)
        if not amount or not entry_date:
            return Response({'detail': 'amount and entry_date are required.'}, status=400)

        entry = IncomeOutcome.objects.create(
            entry_type=entry_type,
            amount=amount,
            description=description,
            entry_date=entry_date,
        )
        return Response({
            'id':          entry.id,
            'entry_type':  entry.entry_type,
            'amount':      str(entry.amount),
            'description': entry.description,
            'entry_date':  str(entry.entry_date),
            'created_at':  entry.created_at.isoformat(),
        }, status=201)


class IncomeOutcomeDeleteView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, pk):
        try:
            IncomeOutcome.objects.get(pk=pk).delete()
            return Response(status=204)
        except IncomeOutcome.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)


class MonthlyReportView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response({'detail': 'month parameter required (YYYY-MM).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            period = datetime.strptime(month_str, '%Y-%m')
        except ValueError:
            return Response({'detail': 'Invalid format. Use YYYY-MM.'}, status=status.HTTP_400_BAD_REQUEST)

        year, month = period.year, period.month

        meal_income = (
            Payment.objects
            .filter(reference_type='meal', payment_date__year=year, payment_date__month=month)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        pos_income_terminal = (
            PosOrder.objects
            .filter(status='paid', created_at__year=year, created_at__month=month)
            .aggregate(total=Sum('total_amount'))['total'] or 0
        )
        pos_income_walkin = (
            Bill.objects
            .filter(source='walk_in', generated_at__year=year, generated_at__month=month)
            .aggregate(total=Sum('total_amount'))['total'] or 0
        )
        pos_income = pos_income_terminal + pos_income_walkin

        event_income = (
            Event.objects
            .filter(status__in=['inquiry', 'confirmed', 'completed'], event_date__year=year, event_date__month=month)
            .aggregate(total=Sum('total_amount'))['total'] or 0
        )

        commissions_paid = (
            PartnerTransaction.objects
            .filter(status='paid', created_at__year=year, created_at__month=month)
            .aggregate(total=Sum('commission_amount'))['total'] or 0
        )

        manual_income = (
            IncomeOutcome.objects
            .filter(entry_type='income', entry_date__year=year, entry_date__month=month)
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        manual_outcome = (
            IncomeOutcome.objects
            .filter(entry_type='outcome', entry_date__year=year, entry_date__month=month)
            .aggregate(total=Sum('amount'))['total'] or 0
        )

        net_profit = (meal_income + pos_income + event_income + manual_income) - (commissions_paid + manual_outcome)

        return Response({
            'month':            month_str,
            'meal_income':      meal_income,
            'pos_income':       pos_income,
            'event_income':     event_income,
            'commissions_paid': commissions_paid,
            'manual_income':    manual_income,
            'manual_outcome':   manual_outcome,
            'net_profit':       net_profit,
        })


class AdminOverviewView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.localdate()
        month, year = today.month, today.year

        meal_orders_month  = MealOrder.objects.filter(created_at__year=year, created_at__month=month).count()
        pos_orders_month   = PosOrder.objects.filter(status='paid', created_at__year=year, created_at__month=month).count()
        bill_orders_month  = Bill.objects.filter(source='walk_in', generated_at__year=year, generated_at__month=month).count()
        total_orders = meal_orders_month + pos_orders_month + bill_orders_month

        pending_orders = MealOrder.objects.filter(
            status='pending', created_at__year=year, created_at__month=month
        ).count()

        pos_rev = PosOrder.objects.filter(
            status='paid', created_at__year=year, created_at__month=month
        ).aggregate(t=Sum('total_amount'))['t'] or 0
        bill_rev = Bill.objects.filter(
            generated_at__year=year, generated_at__month=month
        ).aggregate(t=Sum('total_amount'))['t'] or 0
        month_revenue = float(pos_rev) + float(bill_rev)

        active_events = Event.objects.filter(status__in=['inquiry', 'confirmed']).count()
        partner_count = Branch.objects.filter(is_partner=True).count()

        recent_qs = MealOrder.objects.select_related('student', 'meal_type', 'item').order_by('-created_at')[:5]
        recent_orders = []
        for o in recent_qs:
            label = ''
            if o.order_type == 'item' and o.item:
                label = o.item.name
            elif o.meal_type:
                label = o.meal_type.name
            recent_orders.append({
                'id':           o.id,
                'student_name': o.student.full_name if o.student else '',
                'package':      label,
                'time':         o.created_at.strftime('%I:%M %p'),
                'status':       o.status,
            })

        upcoming_qs = Event.objects.filter(
            event_date__gte=today, status__in=['inquiry', 'confirmed']
        ).order_by('event_date')[:3]
        upcoming_events = [{
            'title':  ev.name,
            'date':   ev.event_date.strftime('%b %d'),
            'status': ev.status,
        } for ev in upcoming_qs]

        popularity_qs = (
            MealOrder.objects
            .filter(order_type='package', meal_type__isnull=False)
            .values('meal_type__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:4]
        )
        total_pkg = sum(r['count'] for r in popularity_qs) or 1
        meal_popularity = [{
            'name': r['meal_type__name'],
            'pct':  round(r['count'] / total_pkg * 100),
        } for r in popularity_qs]

        return Response({
            'total_orders':    total_orders,
            'pending_orders':  pending_orders,
            'month_revenue':   month_revenue,
            'active_events':   active_events,
            'partner_count':   partner_count,
            'recent_orders':   recent_orders,
            'upcoming_events': upcoming_events,
            'meal_popularity': meal_popularity,
        })
