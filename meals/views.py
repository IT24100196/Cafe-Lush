import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from datetime import timedelta, datetime
import uuid

from authentication.permissions import IsAdmin, IsStudent, IsAnyRole, IsAdminOrStudent, IsCashier, IsAdminOrCashier
from pos.models import Item, WeeklyMealPlan
from pos.serializers import ItemSerializer
from reports.models import Payment
from .models import MealType, MealOrder, Student, Notification, MealPackage, Bill, Suggestion
from .serializers import MealTypeSerializer, MealOrderSerializer, NotificationSerializer, MealPackageSerializer, BillSerializer, SuggestionSerializer
from .utils.pdf_generator import generate_bill_pdf

logger = logging.getLogger(__name__)


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
        items = Item.objects.filter(is_available=True).select_related('category').order_by('category__name', 'name')
        return Response(ItemSerializer(items, many=True).data)


class StudentItemsView(APIView):
    """Returns all available POS items grouped with categories — for student menu tab."""
    permission_classes = [IsAdminOrStudent]

    def get(self, request):
        items = Item.objects.filter(is_available=True).select_related('category').order_by('category__name', 'name')
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
                self._validate_cutoff(meal_type, order_date)
            except ValueError as e:
                return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        student_email = serializer.validated_data.get('student_email', '') or (request.user.email or '')
        order = serializer.save(student=student, student_email=student_email, order_date=order_date)
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

        session_id    = str(uuid.uuid4())
        student_email = request.user.email or ''
        created       = []

        for item_data in orders_data:
            serializer = MealOrderSerializer(data=item_data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            order_type = serializer.validated_data.get('order_type', 'package')
            meal_type  = serializer.validated_data.get('meal_type')
            order_date = serializer.validated_data.get('order_date') or timezone.localdate()

            if order_type == 'package' and meal_type:
                try:
                    self._validate_cutoff(meal_type, order_date)
                except ValueError as e:
                    return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            order = serializer.save(
                student=student,
                student_email=student_email,
                order_date=order_date,
                session_id=session_id,
            )
            created.append(order)

        return Response(MealOrderSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


def _record_payment(order):
    """Create a Payment record for a confirmed MealOrder."""
    if order.order_type == 'item' and order.item:
        amount = float(order.item.price) * order.quantity
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
        unit_price = float(slot.price) if slot else 0
        amount = unit_price * order.quantity
    Payment.objects.update_or_create(
        reference_type='meal',
        reference_id=order.id,
        defaults={'amount': amount},
    )


class MealOrderStatusView(APIView):
    """Cashier confirms or cancels an order → creates in-app notification for the student."""
    permission_classes = [IsAdminOrCashier]

    def patch(self, request, pk):
        try:
            order = MealOrder.objects.select_related('student', 'meal_type').get(pk=pk)
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in ('confirmed', 'cancelled'):
            return Response({'detail': 'Status must be confirmed or cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        order.save()

        if new_status == 'confirmed':
            _record_payment(order)
            pickup = 'Expect delivery to your address.' if order.delivery_type == 'delivery' else 'Ready for pickup in ~30 minutes.'
            if order.order_type == 'item':
                label = order.item.name if order.item else 'Item'
            else:
                meal = order.meal_type.name if order.meal_type else 'Package'
                label = f"{'Veg' if order.preference == 'veg' else 'Non-Veg'} {meal}" if order.preference else meal
            msg = f'✅ Your {label} order for {order.order_date} has been confirmed! {pickup}'
        else:
            if order.order_type == 'item':
                label = order.item.name if order.item else 'Item'
            else:
                meal = order.meal_type.name if order.meal_type else 'Package'
                label = f"{'Veg' if order.preference == 'veg' else 'Non-Veg'} {meal}" if order.preference else meal
            msg = f'❌ Your {label} order for {order.order_date} has been cancelled. Please contact us if you have any questions.'

        Notification.objects.create(student=order.student, order=order, message=msg)
        return Response(MealOrderSerializer(order).data)


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
        qs = MealOrder.objects.select_related('student', 'meal_type', 'item') \
                              .order_by('-created_at')
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
            result.append({
                'session_id':     sid,
                'student_name':   first.student.full_name if first.student else '',
                'student_email':  first.student_email,
                'created_at':     first.created_at,
                'delivery_type':  first.delivery_type,
                'delivery_address': first.delivery_address,
                'phone_number':   first.phone_number,
                'status':         first.status,
                'orders':         MealOrderSerializer(orders, many=True).data,
            })
        for order in ungrouped:
            result.append({
                'session_id':     None,
                'student_name':   order.student.full_name if order.student else '',
                'student_email':  order.student_email,
                'created_at':     order.created_at,
                'delivery_type':  order.delivery_type,
                'delivery_address': order.delivery_address,
                'phone_number':   order.phone_number,
                'status':         order.status,
                'orders':         [MealOrderSerializer(order).data],
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
def _generate_bill_number():
    return 'BILL-' + uuid.uuid4().hex[:8].upper()


def _send_bill_email(bill):
    if not bill.sent_to_email:
        return
    try:
        html    = render_to_string('meals/bill_email.html', {'bill': bill})
        pdf_buf = generate_bill_pdf(bill)
        pdf_buf.seek(0)
        pdf_bytes = pdf_buf.read()
        if len(pdf_bytes) == 0:
            raise ValueError('PDF buffer is empty')
        msg = EmailMessage(
            subject=f'Your Bill — {bill.bill_number}',
            body=html,
            to=[bill.sent_to_email],
        )
        msg.content_subtype = 'html'
        msg.attach(f'{bill.bill_number}.pdf', pdf_bytes, 'application/pdf')
        msg.send(fail_silently=False)
    except Exception as e:
        logger.error('Bill email failed for %s: %s', bill.bill_number, e, exc_info=True)


class GenerateBillView(APIView):
    """Cashier generates a bill for a session (all orders sharing session_id) or a single order."""
    permission_classes = [IsAdminOrCashier]

    def post(self, request, order_id):
        try:
            order = MealOrder.objects.select_related('student', 'meal_type', 'item').get(pk=order_id)
        except MealOrder.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if hasattr(order, 'bill'):
            return Response(BillSerializer(order.bill).data)

        # Collect all orders in the same session
        if order.session_id:
            session_orders = list(
                MealOrder.objects.select_related('meal_type', 'item')
                                 .filter(session_id=order.session_id)
            )
        else:
            session_orders = [order]

        items_snapshot = []
        total = 0
        for o in session_orders:
            if o.order_type == 'item' and o.item:
                label      = o.item.name
                unit_price = float(o.item.price)
            else:
                label      = o.meal_type.name if o.meal_type else 'Package'
                meal_category = 'nonveg' if o.preference == 'non-veg' else 'veg'
                meal_time     = o.meal_type.name.lower() if o.meal_type else ''
                slot = WeeklyMealPlan.objects.filter(meal_time=meal_time, meal_category=meal_category).first()
                unit_price = float(slot.price) if slot else 0
            line_total = unit_price * o.quantity
            total     += line_total
            items_snapshot.append({
                'name':       label,
                'qty':        o.quantity,
                'unit_price': unit_price,
                'line_total': line_total,
            })

        bill = Bill.objects.create(
            meal_order    = order,
            bill_number   = _generate_bill_number(),
            source        = 'online',
            items         = items_snapshot,
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

    def post(self, request):
        raw_items     = request.data.get('items', [])
        customer_name = request.data.get('customer_name', '').strip()

        if not raw_items:
            return Response({'detail': 'items is required.'}, status=status.HTTP_400_BAD_REQUEST)

        items_snapshot = []
        total = 0
        for entry in raw_items:
            name       = str(entry.get('name', '')).strip()
            qty        = int(entry.get('quantity', 0))
            unit_price = float(entry.get('unit_price', 0))

            if not name:
                return Response({'detail': 'Each item must have a name.'}, status=status.HTTP_400_BAD_REQUEST)
            if qty <= 0:
                return Response({'detail': f'Quantity for "{name}" must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)
            if unit_price <= 0:
                return Response({'detail': f'Unit price for "{name}" must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            line_total = qty * unit_price
            total     += line_total
            items_snapshot.append({
                'name':       name,
                'qty':        qty,
                'unit_price': unit_price,
                'line_total': line_total,
            })

        bill = Bill.objects.create(
            meal_order    = None,
            bill_number   = _generate_bill_number(),
            source        = 'walk_in',
            customer_name = customer_name,
            items         = items_snapshot,
            total_amount  = total,
            sent_to_email = '',
        )
        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)


class WalkInBillListView(APIView):
    """GET /api/meals/bills/walk-in/ — returns all walk-in bills, newest first."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request):
        bills = Bill.objects.filter(source='walk_in').order_by('-generated_at')
        return Response(BillSerializer(bills, many=True).data)


class BillDetailView(APIView):
    """GET full bill details by bill id — used for print view and email preview."""
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related('meal_order').get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BillSerializer(bill).data)


class BillPrintView(APIView):
    permission_classes = [IsAdminOrCashier]

    def get(self, request, pk):
        try:
            bill = Bill.objects.select_related(
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
            'generated_at':     bill.generated_at.isoformat(),
            'total_amount':     str(bill.total_amount),
            'source':           bill.source,
            'items':            bill.items,
            'student_name':     order.student.full_name if order else '',
            'student_email':    bill.sent_to_email,
            'delivery_address': order.delivery_address if order else '',
            'phone_number':     order.phone_number     if order else '',
            'delivery_type':    order.delivery_type    if order else '',
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
            html    = render_to_string('meals/bill_email.html', {'bill': bill})
            pdf_buf = generate_bill_pdf(bill)
            pdf_buf.seek(0)
            pdf_bytes = pdf_buf.read()
            if len(pdf_bytes) == 0:
                raise ValueError('PDF buffer is empty')
            msg = EmailMessage(
                subject=f'Your Bill — {bill.bill_number}',
                body=html,
                from_email=None,
                to=[email],
            )
            msg.content_subtype = 'html'
            msg.attach(f'{bill.bill_number}.pdf', pdf_bytes, 'application/pdf')
            msg.send(fail_silently=False)
        except Exception as e:
            logger.error('Manual bill email failed for %s: %s', bill.bill_number, e, exc_info=True)
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': f'Bill sent to {email}.'})

