import logging
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from email.mime.image import MIMEImage
from pathlib import Path
from uuid import uuid4
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Case, IntegerField, Value, When
from django.db.models.functions import Substr
from django.http import HttpResponse
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from datetime import timedelta, datetime, time

from authentication.permissions import IsAdmin, IsStudent, IsAnyRole, IsAdminOrStudent, IsCashier, IsAdminOrCashier
from pos.models import Item, WeeklyMealPlan
from pos.serializers import ItemSerializer
from reports.models import Payment
from hotel_pos_backend.validators import validate_generic_email_format
from .delivery import (
    LOCATION_SOURCE_ADDRESS,
    LOCATION_SOURCE_CURRENT,
    build_delivery_address,
    calculate_delivery_quote,
)
from .order_reference import build_order_reference, build_walkin_order_reference
from .models import MealType, MealOrder, Student, Notification, MealPackage, Bill, BillSequence, Suggestion
from .serializers import (
    MealTypeSerializer,
    MealOrderSerializer,
    NotificationSerializer,
    MealPackageSerializer,
    BillSerializer,
    SuggestionSerializer,
    get_package_ready_time,
)
from .utils.pdf_generator import generate_bill_pdf

logger = logging.getLogger(__name__)
MONEY_SCALE = Decimal('0.01')
PACKAGE_ORDER_MAX_DAYS_AHEAD = 3
MENU_ITEM_ORDER_OPEN_TIME = time(4, 0)
MENU_ITEM_LAST_ORDER_TIME = time(23, 30)
MENU_ITEM_ORDER_HOURS_MESSAGE = 'Menu item orders are available from 4:00 AM to 11:30 PM.'
PACKAGE_CANCEL_RULES = {
    'breakfast': {'day_offset': -1, 'time': time(21, 0)},
    'dinner': {'day_offset': 0, 'time': time(23, 0)},
}


def _money(value):
    try:
        return Decimal(str(value)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        return Decimal('0.00')


def _validate_package_order_date(order_date):
    today = timezone.localdate()
    max_date = today + timedelta(days=PACKAGE_ORDER_MAX_DAYS_AHEAD)
    if order_date < today or order_date > max_date:
        raise ValueError('Meal packages can only be ordered from today up to 3 days ahead.')


def _validate_menu_item_order_time():
    now = timezone.localtime(timezone.now()).time()
    if now < MENU_ITEM_ORDER_OPEN_TIME or now > MENU_ITEM_LAST_ORDER_TIME:
        raise ValueError(MENU_ITEM_ORDER_HOURS_MESSAGE)


def _order_ready_message(order):
    if order.order_type == 'package':
        ready_time = get_package_ready_time(order.meal_type)
        if ready_time:
            return f'Ready for takeaway or delivery at {ready_time}.'
        return 'Ready at the scheduled meal package time.'
    return 'Expect delivery to your address.' if order.delivery_type == 'delivery' else 'Ready for pickup in ~30 minutes.'


def _package_cancel_cutoff(order):
    meal_name = (getattr(order.meal_type, 'name', '') or '').strip().lower()
    rule = PACKAGE_CANCEL_RULES.get(meal_name)
    if not rule:
        return None
    cutoff_date = order.order_date + timedelta(days=rule['day_offset'])
    cutoff_dt = datetime.combine(cutoff_date, rule['time'])
    return timezone.make_aware(cutoff_dt, timezone.get_current_timezone())


def _package_cancel_rule_message(order):
    meal_name = (getattr(order.meal_type, 'name', '') or 'Meal package').strip()
    cutoff = _package_cancel_cutoff(order)
    if not cutoff:
        return f'{meal_name} package orders cannot be cancelled online.'
    return f'{meal_name} package orders can be cancelled before {cutoff.strftime("%I:%M %p on %b %d")}.'


def _validate_package_cancel_allowed(package_orders):
    now = timezone.localtime(timezone.now())
    for package_order in package_orders:
        cutoff = _package_cancel_cutoff(package_order)
        if not cutoff:
            raise ValueError(_package_cancel_rule_message(package_order))
        if now >= cutoff:
            raise ValueError(f'Cancellation time has passed. {_package_cancel_rule_message(package_order)}')


def _bill_logo_path():
    candidates = [
        Path(settings.BASE_DIR) / 'media' / 'branding' / 'bill_logo.png',
        Path(settings.BASE_DIR) / 'frontend' / 'public' / 'image' / 'image6.jpeg',
    ]
    for path in candidates:
        if path.exists():
            return path
    return None


def _attach_bill_logo(msg, logo_cid='bill-logo-cid'):
    logo_path = _bill_logo_path()
    if not logo_path:
        return
    try:
        with open(logo_path, 'rb') as logo_file:
            logo_mime = MIMEImage(logo_file.read())
        logo_mime.add_header('Content-ID', f'<{logo_cid}>')
        logo_mime.add_header('Content-Disposition', 'inline', filename=logo_path.name)
        msg.attach(logo_mime)
    except Exception as exc:
        logger.warning('Could not attach bill logo from %s: %s', logo_path, exc)


def _normalized_batch_value(value):
    if isinstance(value, Decimal):
        return value.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
    if isinstance(value, str):
        return value.strip()
    return value


def _single_batch_value(validated_serializers, field_name):
    values = {
        _normalized_batch_value(serializer.validated_data.get(field_name))
        for serializer in validated_serializers
    }
    if len(values) == 1:
        return next(iter(values))
    return None


def _calculate_session_delivery_fee(validated_serializers):
    delivery_type = (_single_batch_value(validated_serializers, 'delivery_type') or 'takeaway').lower()
    has_package = any(
        serializer.validated_data.get('order_type', 'package') == 'package'
        for serializer in validated_serializers
    )


def _ordered_available_items():
    return (
        Item.objects
        .filter(is_available=True, category__is_active=True)
        .select_related('category')
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
    location_source = _single_batch_value(validated_serializers, 'location_source') or LOCATION_SOURCE_ADDRESS
    full_address = build_delivery_address(
        _single_batch_value(validated_serializers, 'address_line_1') or '',
        _single_batch_value(validated_serializers, 'address_line_2') or '',
        _single_batch_value(validated_serializers, 'city_area') or '',
    )
    latitude = _single_batch_value(validated_serializers, 'delivery_latitude')
    longitude = _single_batch_value(validated_serializers, 'delivery_longitude')
    return calculate_delivery_quote(
        delivery_type=delivery_type,
        has_package=has_package,
        location_source=location_source,
        full_address=full_address,
        latitude=latitude,
        longitude=longitude,
    )


class MealTypeViewSet(viewsets.ModelViewSet):
    queryset         = MealType.objects.all()
    serializer_class = MealTypeSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAnyRole()]
        return [IsAdmin()]


class MealPackageViewSet(viewsets.ModelViewSet):
    queryset         = MealPackage.objects.prefetch_related('items').select_related('meal_type').all()
    serializer_class = MealPackageSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAnyRole()]
        return [IsAdmin()]


class PosItemsForPackageView(APIView):
    """Returns all available POS items for the package item-picker."""
    permission_classes = [IsAdmin]

    def get(self, request):
        items = _ordered_available_items()
        return Response(ItemSerializer(items, many=True).data)


class StudentItemsView(APIView):
    """Returns all available POS items grouped with categories — for student menu tab."""
    permission_classes = [IsAdminOrStudent]

    def get(self, request):
        items = _ordered_available_items()
        return Response(ItemSerializer(items, many=True, context={'request': request}).data)


class MealOrderView(APIView):
    permission_classes = [IsAdminOrStudent]

    def _validate_cutoff(self, meal_type, order_date):
        now  = timezone.localtime(timezone.now())
        name = meal_type.name.lower()

        if name == 'breakfast':
            cutoff_dt = datetime.combine(order_date - timedelta(days=1), datetime.strptime('20:00', '%H:%M').time())
        elif name == 'dinner':
            cutoff_dt = datetime.combine(order_date, datetime.strptime('12:00', '%H:%M').time())
        else:
            cutoff_dt = datetime.combine(order_date, meal_type.cutoff_time)

        cutoff = timezone.make_aware(cutoff_dt, timezone.get_current_timezone())
        if now > cutoff:
            raise ValueError(
                f'Order cutoff for {meal_type.name} has passed. '
                f'You must order before {cutoff.strftime("%I:%M %p on %b %d")}.'
            )

    def post(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MealOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_type = serializer.validated_data.get('order_type', 'package')
        meal_type  = serializer.validated_data.get('meal_type')
        order_date = serializer.validated_data.get('order_date') or timezone.localdate()

        if order_type == 'package' and meal_type:
            try:
                _validate_package_order_date(order_date)
                self._validate_cutoff(meal_type, order_date)
            except ValueError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        elif order_type == 'item':
            try:
                _validate_menu_item_order_time()
            except ValueError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        student_email = serializer.validated_data.get('student_email', '') or (request.user.email or '')
        try:
            delivery_quote = calculate_delivery_quote(
                delivery_type=serializer.validated_data.get('delivery_type', 'takeaway'),
                has_package=order_type == 'package',
                location_source=serializer.validated_data.get('location_source', LOCATION_SOURCE_ADDRESS),
                full_address=serializer.validated_data.get('delivery_address', ''),
                latitude=serializer.validated_data.get('delivery_latitude'),
                longitude=serializer.validated_data.get('delivery_longitude'),
            )
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save(
            student=student,
            student_email=student_email,
            order_date=order_date,
            delivery_fee=delivery_quote['delivery_fee'],
        )
        return Response(MealOrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        if request.user.role.name == 'admin':
            qs = MealOrder.objects.select_related('student', 'meal_type', 'item').order_by('-created_at')
            date          = request.query_params.get('order_date')
            status_filter = request.query_params.get('status')
            type_filter   = request.query_params.get('order_type')
            if date:          qs = qs.filter(order_date=date)
            if status_filter: qs = qs.filter(status=status_filter)
            if type_filter:   qs = qs.filter(order_type=type_filter)
            return Response(MealOrderSerializer(qs, many=True).data)

        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        orders = MealOrder.objects.filter(student=student).order_by('-created_at')
        return Response(MealOrderSerializer(orders, many=True).data)


class DeliveryFeeEstimateView(APIView):
    permission_classes = [IsAdminOrStudent]

    def post(self, request):
        delivery_type = (request.data.get('delivery_type') or 'delivery').strip().lower()
        has_package = bool(request.data.get('has_package'))
        address_line_1 = (request.data.get('address_line_1') or '').strip()
        address_line_2 = (request.data.get('address_line_2') or '').strip()
        city_area = (request.data.get('city_area') or '').strip()
        location_source = (request.data.get('location_source') or LOCATION_SOURCE_ADDRESS).strip() or LOCATION_SOURCE_ADDRESS
        full_address = build_delivery_address(address_line_1, address_line_2, city_area)

        try:
            quote = calculate_delivery_quote(
                delivery_type=delivery_type,
                has_package=has_package,
                location_source=location_source,
                full_address=full_address,
                latitude=request.data.get('delivery_latitude'),
                longitude=request.data.get('delivery_longitude'),
            )
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'delivery_fee': str(quote['delivery_fee']),
            'delivery_fee_label': quote['label'],
            'distance_km': float(quote['distance_km']) if quote['distance_km'] is not None else None,
            'delivery_address': full_address,
            'location_source': quote['location_source'],
        })


class MealOrderBatchView(APIView):
    """POST a batch of orders (package + items) under one session_id."""
    permission_classes = [IsAdminOrStudent]

    def _validate_cutoff(self, meal_type, order_date):
        now  = timezone.localtime(timezone.now())
        name = meal_type.name.lower()
        if name == 'breakfast':
            cutoff_dt = datetime.combine(order_date - timedelta(days=1), datetime.strptime('20:00', '%H:%M').time())
        elif name == 'dinner':
            cutoff_dt = datetime.combine(order_date, datetime.strptime('12:00', '%H:%M').time())
        else:
            cutoff_dt = datetime.combine(order_date, meal_type.cutoff_time)
        cutoff = timezone.make_aware(cutoff_dt, timezone.get_current_timezone())
        if now > cutoff:
            raise ValueError(
                f'Order cutoff for {meal_type.name} has passed. '
                f'You must order before {cutoff.strftime("%I:%M %p on %b %d")}.'
            )

    def post(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        orders_data = request.data.get('orders', [])
        if not orders_data:
            return Response({'detail': 'No orders provided.'}, status=status.HTTP_400_BAD_REQUEST)

        session_id    = str(uuid4())
        student_email = request.user.email or ''
        created       = []
        validated_serializers = []

        for item_data in orders_data:
            serializer = MealOrderSerializer(data=item_data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            validated_serializers.append(serializer)

        delivery_types = {
            (serializer.validated_data.get('delivery_type') or 'takeaway').lower()
            for serializer in validated_serializers
        }
        if len(delivery_types) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same order method.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone_numbers = {
            (serializer.validated_data.get('phone_number') or '').strip()
            for serializer in validated_serializers
        }
        if len(phone_numbers) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same phone number.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery_details = {
            (serializer.validated_data.get('delivery_address') or '').strip()
            for serializer in validated_serializers
        }
        if len(delivery_details) > 1:
            detail_label = 'delivery address' if 'delivery' in delivery_types else 'pickup details'
            return Response(
                {'detail': f'All orders in the same checkout must use the same {detail_label}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        address_line_1_values = {
            (serializer.validated_data.get('address_line_1') or '').strip()
            for serializer in validated_serializers
        }
        if len(address_line_1_values) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same address line 1.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        address_line_2_values = {
            (serializer.validated_data.get('address_line_2') or '').strip()
            for serializer in validated_serializers
        }
        if len(address_line_2_values) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same address line 2.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        city_area_values = {
            (serializer.validated_data.get('city_area') or '').strip()
            for serializer in validated_serializers
        }
        if len(city_area_values) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same city or area.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        location_sources = {
            (serializer.validated_data.get('location_source') or LOCATION_SOURCE_ADDRESS).strip()
            for serializer in validated_serializers
        }
        if len(location_sources) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same delivery location mode.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery_latitudes = {
            serializer.validated_data.get('delivery_latitude')
            for serializer in validated_serializers
        }
        if len(delivery_latitudes) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same delivery latitude.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delivery_longitudes = {
            serializer.validated_data.get('delivery_longitude')
            for serializer in validated_serializers
        }
        if len(delivery_longitudes) > 1:
            return Response(
                {'detail': 'All orders in the same checkout must use the same delivery longitude.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            delivery_quote = _calculate_session_delivery_fee(validated_serializers)
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                for serializer in validated_serializers:
                    order_type = serializer.validated_data.get('order_type', 'package')
                    meal_type  = serializer.validated_data.get('meal_type')
                    order_date = serializer.validated_data.get('order_date') or timezone.localdate()

                    if order_type == 'package' and meal_type:
                        _validate_package_order_date(order_date)
                        self._validate_cutoff(meal_type, order_date)
                    elif order_type == 'item':
                        _validate_menu_item_order_time()

                    order = serializer.save(
                        student=student,
                        student_email=student_email,
                        order_date=order_date,
                        session_id=session_id,
                        delivery_fee=delivery_quote['delivery_fee'],
                    )
                    created.append(order)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(MealOrderSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


def _record_payment(order):
    """Create a Payment record for a confirmed MealOrder."""
    if order.order_type == 'item' and order.item:
        unit_price = _money(order.item.price)
        amount = (unit_price * Decimal(order.quantity or 0)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    else:
        meal_category = 'nonveg' if order.preference == 'non-veg' else 'veg'
        meal_time     = order.meal_type.name.lower() if order.meal_type else ''
        day_of_week   = order.order_date.weekday()  # 0=Mon … 6=Sun
        slot = WeeklyMealPlan.objects.filter(
            meal_time=meal_time, meal_category=meal_category, day_of_week=day_of_week
        ).first()
        if not slot:
            # fallback: any day with matching meal_time + category
            slot = WeeklyMealPlan.objects.filter(
                meal_time=meal_time, meal_category=meal_category
            ).first()
        unit_price = _money(slot.price) if slot else Decimal('0.00')
        amount = (unit_price * Decimal(order.quantity or 0)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    if order.delivery_type == 'delivery' and not order.session_id:
        amount = (amount + _money(order.delivery_fee)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
    Payment.objects.update_or_create(
        reference_type='meal',
        reference_id=order.id,
        defaults={
            'amount': amount,
            'payment_date': timezone.make_aware(
                timezone.datetime.combine(order.order_date, timezone.datetime.min.time()),
                timezone.get_current_timezone(),
            ),
        },
    )


class MealOrderStatusView(APIView):
    """Cashier confirms or cancels an order → creates in-app notification for the student."""
    permission_classes = [IsAdminOrCashier]

    @transaction.atomic
    def patch(self, request, pk):
        try:
            order = (
                MealOrder.objects
                .select_for_update()
                .get(pk=pk)
            )
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('confirmed', 'cancelled', 'completed'):
            return Response({'detail': 'Status must be confirmed, cancelled, or completed.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.status == new_status:
            return Response(MealOrderSerializer(order).data)

        bill_exists = (
            Bill.objects.filter(source='online', meal_order__session_id=order.session_id).exists()
            if order.session_id
            else hasattr(order, 'bill')
        )
        if bill_exists and new_status != 'completed':
            return Response(
                {'detail': 'This order already has a bill and cannot be changed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.status in ('cancelled', 'completed'):
            return Response(
                {'detail': 'Completed or cancelled orders cannot be changed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == 'completed' and order.status != 'confirmed':
            return Response(
                {'detail': 'Only confirmed orders can be completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status in ('confirmed', 'cancelled') and order.status != 'pending':
            return Response(
                {'detail': 'Only pending orders can be confirmed or rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.status = new_status
        order.save()

        if new_status == 'confirmed':
            _record_payment(order)
            pickup = _order_ready_message(order)
            if order.order_type == 'item':
                label = order.item.name if order.item else 'Item'
            else:
                meal = order.meal_type.name if order.meal_type else 'Package'
                label = f"{'Veg' if order.preference == 'veg' else 'Non-Veg'} {meal}" if order.preference else meal
            msg = f'✅ Your {label} order for {order.order_date} has been confirmed! {pickup}'
        elif new_status == 'cancelled':
            Payment.objects.filter(reference_type='meal', reference_id=order.id).delete()
            if order.order_type == 'item':
                label = order.item.name if order.item else 'Item'
            else:
                meal = order.meal_type.name if order.meal_type else 'Package'
                label = f"{'Veg' if order.preference == 'veg' else 'Non-Veg'} {meal}" if order.preference else meal
            msg = f'❌ Your {label} order for {order.order_date} has been cancelled. Please contact us if you have any questions.'
        else:
            if order.order_type == 'item':
                label = order.item.name if order.item else 'Item'
            else:
                meal = order.meal_type.name if order.meal_type else 'Package'
                label = f"{'Veg' if order.preference == 'veg' else 'Non-Veg'} {meal}" if order.preference else meal
            done = 'delivered' if order.delivery_type == 'delivery' else 'picked up'
            msg = f'✅ Your {label} order for {order.order_date} has been completed. Thank you - it was marked as {done}.'

        Notification.objects.create(student=order.student, order=order, message=msg)
        return Response(MealOrderSerializer(order).data)


class StudentOrderCancelView(APIView):
    """Student cancels their own pending meal package or combined package order."""
    permission_classes = [IsStudent]

    @transaction.atomic
    def patch(self, request, pk):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            order = (
                MealOrder.objects
                .select_for_update()
                .select_related('student')
                .get(pk=pk, student=student)
            )
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.session_id:
            session_orders = list(
                MealOrder.objects
                .select_for_update()
                .select_related('student')
                .filter(student=student, session_id=order.session_id)
                .order_by('created_at', 'id')
            )
        else:
            session_orders = [order]

        package_orders = [session_order for session_order in session_orders if session_order.order_type == 'package']
        if not package_orders:
            return Response(
                {'detail': 'Only meal package or combined meal package orders can be cancelled here.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if any(session_order.status != 'pending' for session_order in session_orders):
            return Response(
                {'detail': 'Only pending orders can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bill_exists = (
            Bill.objects.filter(source='online', meal_order__session_id=order.session_id).exists()
            if order.session_id
            else hasattr(order, 'bill')
        )
        if bill_exists:
            return Response(
                {'detail': 'This order already has a bill and cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            _validate_package_cancel_allowed(package_orders)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        for session_order in session_orders:
            session_order.status = 'cancelled'
            session_order.save(update_fields=['status'])

        package_order = package_orders[0]
        label = package_order.package_label if hasattr(package_order, 'package_label') else None
        if not label:
            meal = package_order.meal_type.name if package_order.meal_type else 'Meal package'
            label = f"{'Veg' if package_order.preference == 'veg' else 'Non-Veg'} {meal}" if package_order.preference else meal
        extra = ' and all menu items in the same order' if len(session_orders) > len(package_orders) else ''
        Notification.objects.create(
            student=student,
            order=package_order,
            message=f'Your {label} order for {package_order.order_date}{extra} has been cancelled.',
        )

        return Response(MealOrderSerializer(session_orders, many=True).data)


class NotificationView(APIView):
    """Student fetches their notifications and marks them all read."""
    permission_classes = [IsStudent]

    def get(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response([])
        notifs = Notification.objects.filter(student=student)
        return Response(NotificationSerializer(notifs, many=True).data)

    def patch(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response([])
        Notification.objects.filter(student=student, is_read=False).update(is_read=True)
        return Response({'detail': 'All marked as read.'})


# ── Online orders — list + detail (admin & cashier) ──────────────────────────
class OnlineOrdersView(APIView):
    """GET list of all online meal orders grouped by session_id."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request):
        qs = MealOrder.objects.select_related('student', 'meal_type', 'item', 'bill', 'bill__cashier') \
                              .order_by('-created_at')
        order_ref_cache = {}
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Group by session_id; orders without a session are their own group
        sessions = {}
        ungrouped = []
        for order in qs:
            sid = order.session_id
            if sid:
                if sid not in sessions:
                    sessions[sid] = []
                sessions[sid].append(order)
            else:
                ungrouped.append(order)

        result = []
        for sid, orders in sessions.items():
            first = orders[0]
            session_bill_number = next((o.bill.bill_number for o in orders if getattr(o, 'bill', None)), '')
            session_bill = next((o.bill for o in orders if getattr(o, 'bill', None)), None)
            session_delivery_fee = _money(session_bill.delivery_fee if session_bill else first.delivery_fee)
            serialized_orders = MealOrderSerializer(
                orders,
                many=True,
                context={'_order_reference_cache': order_ref_cache},
            ).data
            result.append({
                'session_id':     sid,
                'order_reference': build_order_reference(first, cache=order_ref_cache),
                'bill_number':    session_bill_number,
                'cashier_name':   session_bill.cashier.username if session_bill and session_bill.cashier else '',
                'student_name':   first.student.full_name if first.student else '',
                'student_email':  first.student_email,
                'created_at':     first.created_at,
                'delivery_type':  first.delivery_type,
                'delivery_address': first.delivery_address,
                'delivery_fee':   str(session_delivery_fee),
                'phone_number':   first.phone_number,
                'status':         first.status,
                'orders':         serialized_orders,
            })
        for order in ungrouped:
            serialized_order = MealOrderSerializer(
                order,
                context={'_order_reference_cache': order_ref_cache},
            ).data
            result.append({
                'session_id':     None,
                'order_reference': build_order_reference(order, cache=order_ref_cache),
                'bill_number':    order.bill.bill_number if getattr(order, 'bill', None) else '',
                'cashier_name':   order.bill.cashier.username if getattr(order, 'bill', None) and order.bill.cashier else '',
                'student_name':   order.student.full_name if order.student else '',
                'student_email':  order.student_email,
                'created_at':     order.created_at,
                'delivery_type':  order.delivery_type,
                'delivery_address': order.delivery_address,
                'delivery_fee':   str(_money(order.delivery_fee)),
                'phone_number':   order.phone_number,
                'status':         order.status,
                'orders':         [serialized_order],
            })

        result.sort(key=lambda x: x['created_at'], reverse=True)
        # Serialize datetime for JSON
        for r in result:
            r['created_at'] = r['created_at'].isoformat()
        return Response(result)


class OnlineOrderDetailView(APIView):
    """GET a single online order by id."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            order = MealOrder.objects.select_related('student', 'meal_type', 'item').get(pk=pk)
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(MealOrderSerializer(order).data)


# ── Bill generation helpers ───────────────────────────────────────────────────
def _generate_bill_number(source='online'):
    source_code = 'ON' if source == 'online' else 'WI'
    local_date = timezone.localdate()
    date_part = local_date.strftime('%Y%m%d')
    prefix = f'BILL-{date_part}-{source_code}-'

    sequence, _ = (
        BillSequence.objects
        .select_for_update()
        .get_or_create(
            source=source,
            sequence_date=local_date,
            defaults={'last_number': 0},
        )
    )
    sequence.last_number += 1
    sequence.save(update_fields=['last_number'])
    return f'{prefix}{sequence.last_number:04d}'


def _send_bill_email(bill):
    if not bill.sent_to_email:
        return
    try:
        logo_cid = 'bill-logo-cid'
        html    = render_to_string('meals/bill_email.html', {'bill': bill, 'logo_cid': logo_cid})
        pdf_buf = generate_bill_pdf(bill)
        pdf_buf.seek(0)
        pdf_bytes = pdf_buf.read()
        if len(pdf_bytes) == 0:
            raise ValueError('PDF buffer is empty')
        msg = EmailMessage(
            subject=f'Your Bill - {bill.bill_number}',
            body=html,
            to=[bill.sent_to_email],
        )
        msg.content_subtype = 'html'
        _attach_bill_logo(msg, logo_cid=logo_cid)
        msg.attach(f'{bill.bill_number}.pdf', pdf_bytes, 'application/pdf')
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error('Bill email failed for %s: %s', bill.bill_number, e, exc_info=True)


class GenerateBillView(APIView):
    """Cashier generates a bill for a session (all orders sharing session_id) or a single order."""
    permission_classes = [IsAdminOrCashier]

    @transaction.atomic
    def post(self, request, order_id):
        try:
            order = (
                MealOrder.objects
                .select_for_update()
                .get(pk=order_id)
            )
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.session_id:
            session_orders = list(
                MealOrder.objects
                .select_for_update()
                .filter(session_id=order.session_id)
                .order_by('created_at', 'id')
            )
        else:
            session_orders = [order]

        existing_bill = (
            Bill.objects.select_related('cashier', 'meal_order')
            .filter(source='online', meal_order__session_id=order.session_id)
            .order_by('-generated_at')
            .first()
            if order.session_id
            else Bill.objects.select_related('cashier', 'meal_order').filter(source='online', meal_order=order).first()
        )
        if existing_bill:
            return Response(BillSerializer(existing_bill).data)

        if any(o.status == 'cancelled' for o in session_orders):
            return Response(
                {'detail': 'Cancelled orders cannot be billed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for session_order in session_orders:
            if session_order.status == 'pending':
                session_order.status = 'confirmed'
                session_order.save(update_fields=['status'])

        items_snapshot = []
        subtotal = Decimal('0.00')
        for o in session_orders:
            if o.order_type == 'item' and o.item:
                label      = o.item.name
                unit_price = _money(o.item.price)
            else:
                label      = o.meal_type.name if o.meal_type else 'Package'
                meal_category = 'nonveg' if o.preference == 'non-veg' else 'veg'
                meal_time     = o.meal_type.name.lower() if o.meal_type else ''
                slot = WeeklyMealPlan.objects.filter(meal_time=meal_time, meal_category=meal_category).first()
                unit_price = _money(slot.price) if slot else Decimal('0.00')
            line_total = (unit_price * Decimal(o.quantity or 0)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
            subtotal += line_total
            items_snapshot.append({
                'name':       label,
                'qty':        o.quantity,
                'unit_price': str(unit_price),
                'line_total': str(line_total),
            })

        delivery_fee = _money(session_orders[0].delivery_fee if session_orders else 0)
        total = (subtotal + delivery_fee).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)

        bill = Bill.objects.create(
            meal_order    = order,
            cashier       = request.user,
            bill_number   = _generate_bill_number('online'),
            order_reference = build_order_reference(order),
            source        = 'online',
            items         = items_snapshot,
            delivery_type = order.delivery_type,
            delivery_address = order.delivery_address,
            phone_number  = order.phone_number,
            subtotal_amount = subtotal.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP),
            delivery_fee  = delivery_fee,
            total_amount  = total,
            sent_to_email = order.student_email or (order.student.user.email if order.student.user else ''),
        )

        # Replace Payment records with the correct bill total,
        # dated to the order's own date so it lands in the right month's report
        existing_ids = {o.id for o in session_orders}
        Payment.objects.filter(reference_type='meal', reference_id__in=existing_ids).delete()
        Payment.objects.create(
            reference_type='meal',
            reference_id=order.id,
            amount=total,
            payment_date=timezone.make_aware(
                timezone.datetime.combine(order.order_date, timezone.datetime.min.time()),
                timezone.get_current_timezone(),
            ),
        )

        _send_bill_email(bill)
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)


class WalkInBillView(APIView):
    """
    POST — Cashier creates a walk-in counter sale bill.
    Body: { customer_name (optional), items: [{name, quantity, unit_price}] }
    """
    permission_classes = [IsAdminOrCashier]

    @transaction.atomic
    def post(self, request):
        raw_items     = request.data.get('items', [])
        customer_name = request.data.get('customer_name', '').strip()

        if not raw_items:
            return Response({'detail': 'items is required.'}, status=status.HTTP_400_BAD_REQUEST)

        items_snapshot = []
        total = Decimal('0.00')
        for entry in raw_items:
            name = str(entry.get('name', '')).strip()

            if not name:
                return Response({'detail': 'Each item must have a name.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                qty = int(entry.get('quantity', 0))
            except (TypeError, ValueError):
                return Response({'detail': f'Quantity for "{name}" must be a valid integer.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                unit_price = Decimal(str(entry.get('unit_price', 0)))
            except (TypeError, ValueError, InvalidOperation):
                return Response({'detail': f'Unit price for "{name}" must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

            if qty <= 0:
                return Response({'detail': f'Quantity for "{name}" must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            if unit_price <= 0:
                return Response({'detail': f'Unit price for "{name}" must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = unit_price.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
            line_total = (unit_price * Decimal(qty)).quantize(MONEY_SCALE, rounding=ROUND_HALF_UP)
            total += line_total
            items_snapshot.append({
                'name':       name,
                'qty':        qty,
                'unit_price': str(unit_price),
                'line_total': str(line_total),
            })

        bill = Bill.objects.create(
            meal_order    = None,
            cashier       = request.user,
            bill_number   = _generate_bill_number('walk_in'),
            source        = 'walk_in',
            customer_name = customer_name,
            items         = items_snapshot,
            total_amount  = total.quantize(MONEY_SCALE, rounding=ROUND_HALF_UP),
            sent_to_email = '',
        )
        bill.order_reference = build_walkin_order_reference(bill)
        bill.save(update_fields=['order_reference'])
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)


class WalkInBillListView(APIView):
    """GET /api/meals/bills/walk-in/ — returns all walk-in bills, newest first."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request):
        bills = Bill.objects.select_related('cashier').filter(source='walk_in').order_by('-generated_at')
        return Response(BillSerializer(bills, many=True).data)


class BillDetailView(APIView):
    """GET full bill details by bill id — used for print view and email preview."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related('cashier', 'meal_order').get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BillSerializer(bill).data)


class BillPrintView(APIView):
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related(
                'cashier',
                'meal_order__student__user',
                'meal_order__meal_type',
                'meal_order__item',
            ).get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        if bill.source != 'online':
            return Response(
                {'detail': 'Print delivery copy is only available for online orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = bill.meal_order
        data = {
            'bill_number':      bill.bill_number,
            'order_reference':  bill.order_reference or (build_order_reference(order) if order else ''),
            'generated_at':     bill.generated_at.isoformat(),
            'subtotal_amount':  str(bill.subtotal_amount),
            'delivery_fee':     str(bill.delivery_fee),
            'total_amount':     str(bill.total_amount),
            'source':           bill.source,
            'cashier_name':     bill.cashier.username if bill.cashier else '',
            'items':            bill.items,
            'student_name':     order.student.full_name if order else '',
            'student_email':    bill.sent_to_email,
            'delivery_address': bill.delivery_address or (order.delivery_address if order else ''),
            'phone_number':     bill.phone_number or (order.phone_number if order else ''),
            'delivery_type':    bill.delivery_type or (order.delivery_type if order else ''),
            'order_id':         order.id               if order else None,
        }
        return Response(data)


class BillPdfView(APIView):
    """GET /api/meals/bills/<pk>/pdf/ — returns bill as PDF inline in browser."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            pdf_buf  = generate_bill_pdf(bill)
            response = HttpResponse(pdf_buf, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="{bill.bill_number}.pdf"'
            return response
        except Exception as e:
            logger.error('PDF generation failed for bill %s: %s', pk, e)
            return Response({'detail': 'PDF generation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClearOrderHistoryView(APIView):
    """DELETE — removes all orders belonging to the logged-in student."""
    permission_classes = [IsStudent]

    def delete(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        MealOrder.objects.filter(student=student).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SuggestionView(APIView):
    """Student submits a suggestion; admin lists and marks them read."""

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsStudent()]
        return [IsAdmin()]

    def post(self, request):
        student = Student.objects.filter(user=request.user).first()
        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SuggestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(student=student)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        suggestions = Suggestion.objects.select_related('student').all()
        return Response(SuggestionSerializer(suggestions, many=True).data)

    def patch(self, request):
        """Mark all unread suggestions as read and notify each student."""
        unread = list(Suggestion.objects.filter(is_read=False).select_related('student'))
        for suggestion in unread:
            preview = suggestion.message[:80] + ('...' if len(suggestion.message) > 80 else '')
            Notification.objects.create(
                student=suggestion.student,
                order=None,
                message=f'\U0001f4ac The admin has reviewed your suggestion: "{preview}"',
            )
        Suggestion.objects.filter(is_read=False).update(is_read=True)
        return Response({'detail': 'All marked as read.'})


class SendBillEmailView(APIView):
    """POST /api/meals/bills/<pk>/send-email/ — sends bill PDF to given email."""
    permission_classes = [IsAdminOrCashier]

    def post(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        email = request.data.get('email', '').strip() or bill.sent_to_email
        if not email:
            return Response({'detail': 'No email address provided.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            email = validate_generic_email_format(email, required=True)
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            return Response({'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        try:
            logo_cid = 'bill-logo-cid'
            html    = render_to_string('meals/bill_email.html', {'bill': bill, 'logo_cid': logo_cid})
            pdf_buf = generate_bill_pdf(bill)
            pdf_buf.seek(0)
            pdf_bytes = pdf_buf.read()
            if len(pdf_bytes) == 0:
                raise ValueError('PDF buffer is empty')
            msg = EmailMessage(
                subject=f'Your Bill - {bill.bill_number}',
                body=html,
                from_email=None,
                to=[email],
            )
            msg.content_subtype = 'html'
            _attach_bill_logo(msg, logo_cid=logo_cid)
            msg.attach(f'{bill.bill_number}.pdf', pdf_bytes, 'application/pdf')
            msg.send(fail_silently=False)
        except Exception as e:
            logger.error('Manual bill email failed for %s: %s', bill.bill_number, e, exc_info=True)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': f'Bill sent to {email}.'})
