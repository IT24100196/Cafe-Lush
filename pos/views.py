from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Case, Count, IntegerField, Sum, Value, When
from django.db.models.functions import Substr
from django.utils import timezone

from authentication.permissions import IsAdmin, IsCashier, IsAdminOrCashier
from .models import Category, Item, PosOrder, PosOrderItem, FeaturedItem, WeeklyMealPlan
from meals.models import Bill
from .serializers import (
    CategorySerializer, ItemSerializer,
    CreatePosOrderSerializer, PosOrderSerializer,
    FeaturedItemSerializer, WeeklyMealPlanSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset           = Category.objects.filter(is_active=True)
    serializer_class   = CategorySerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrCashier()]
        return [IsAdmin()]

    def perform_destroy(self, instance):
        item_ids = list(instance.items.values_list('id', flat=True))
        if item_ids:
            FeaturedItem.objects.filter(item_id__in=item_ids).delete()
            instance.items.update(is_available=False)

        suffix = f' (deleted {instance.pk})'
        instance.name = f'{instance.name[:100 - len(suffix)]}{suffix}'
        instance.is_active = False
        instance.save(update_fields=['name', 'is_active'])


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class   = ItemSerializer

    def get_queryset(self):
        return (
            Item.objects
            .select_related('category')
            .filter(category__is_active=True)
            .annotate(
                missing_item_code=Case(
                    When(item_id='', then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                ),
                item_code_group=Substr('item_id', 4),
                item_code_number=Substr('item_id', 1, 3),
            )
            .order_by('missing_item_code', 'item_code_group', 'item_code_number', 'name', 'id')
        )

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAdminOrCashier()]
        return [IsAdmin()]

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class CreatePosOrderView(APIView):
    permission_classes = [IsAdminOrCashier]

    def get(self, request):
        date   = request.query_params.get('date', timezone.localdate().isoformat())
        orders = PosOrder.objects.filter(
            created_at__date=date, status='paid'
        ).prefetch_related('order_items__item').order_by('-created_at')
        return Response(PosOrderSerializer(orders, many=True).data)

    @transaction.atomic
    def post(self, request):
        serializer = CreatePosOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for entry in serializer.validated_data['items']:
            if entry['item'].price <= 0:
                return Response(
                    {'detail': f'Item "{entry["item"].name}" has an invalid price. Update the item price and try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order = PosOrder.objects.create(cashier=request.user, total_amount=0)
        total = 0

        for entry in serializer.validated_data['items']:
            item       = entry['item']
            qty        = entry['quantity']
            unit_price = item.price
            PosOrderItem.objects.create(
                pos_order=order, item=item, quantity=qty, unit_price=unit_price
            )
            total += qty * unit_price

        order.total_amount = total
        order.status       = 'paid'
        order.save()

        return Response(PosOrderSerializer(order).data, status=status.HTTP_201_CREATED)


def _seed_weekly_meal_plan():
    """Ensure all 42 slots exist, inserting only the ones that are missing."""
    existing = set(
        WeeklyMealPlan.objects.values_list('day_of_week', 'meal_time', 'meal_category')
    )
    missing = [
        WeeklyMealPlan(day_of_week=day, meal_time=meal, meal_category=cat)
        for day  in range(7)
        for meal in ('breakfast', 'lunch', 'dinner')
        for cat  in ('veg', 'nonveg')
        if (day, meal, cat) not in existing
    ]
    if missing:
        WeeklyMealPlan.objects.bulk_create(missing, ignore_conflicts=True)


class WeeklyMealPlanView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAdmin()]

    def get(self, request):
        _seed_weekly_meal_plan()
        qs = WeeklyMealPlan.objects.all()
        return Response(WeeklyMealPlanSerializer(qs, many=True).data)


class WeeklyMealPlanDetailView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            slot = WeeklyMealPlan.objects.get(pk=pk)
        except WeeklyMealPlan.DoesNotExist:
            return Response({'detail': 'Slot not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = WeeklyMealPlanSerializer(slot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class FeaturedItemView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAdmin()]

    def get(self, request):
        qs = FeaturedItem.objects.select_related('item__category').filter(
            item__is_available=True,
            item__category__is_active=True,
        )
        return Response(FeaturedItemSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        position = request.data.get('position')
        item_id  = request.data.get('item')
        FeaturedItem.objects.update_or_create(
            position=position, defaults={'item_id': item_id}
        )
        return Response({'status': 'ok'})


class FeaturedItemDeleteView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, position):
        FeaturedItem.objects.filter(position=position).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DailySummaryView(APIView):
    permission_classes = [IsAdminOrCashier]

    def get(self, request):
        date   = request.query_params.get('date', timezone.localdate().isoformat())
        pos    = PosOrder.objects.filter(created_at__date=date, status='paid')
        walkin = Bill.objects.filter(source='walk_in', generated_at__date=date)
        pos_result = pos.aggregate(total_sales=Sum('total_amount'), total_orders=Count('id'))
        walkin_result = walkin.aggregate(total_sales=Sum('total_amount'), total_orders=Count('id'))
        return Response({
            'date':         date,
            'total_orders': (pos_result['total_orders'] or 0) + (walkin_result['total_orders'] or 0),
            'total_sales':  (pos_result['total_sales']  or 0) + (walkin_result['total_sales']  or 0),
        })
