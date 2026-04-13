from django.utils import timezone

from .models import Bill, MealOrder


_TYPE_CODE = {
    'takeaway': 'T',
    'delivery': 'D',
}

_MEAL_CODE = {
    'breakfast': 'B',
    'lunch': 'L',
    'dinner': 'D',
}


def _session_key(order):
    return order.session_id or f'single-{order.id}'


def _session_orders(order, cache):
    key = _session_key(order)
    session_map = cache.setdefault('session_orders', {})
    if key in session_map:
        return session_map[key]

    if order.session_id:
        orders = list(
            MealOrder.objects.select_related('meal_type')
            .filter(session_id=order.session_id)
            .order_by('created_at', 'id')
        )
    else:
        orders = [order]

    session_map[key] = orders
    return orders


def _daily_sequence_map(local_date, cache):
    daily_map = cache.setdefault('daily_sequence', {})
    if local_date in daily_map:
        return daily_map[local_date]

    session_sequence = {}
    counter = 0
    day_orders = (
        MealOrder.objects.filter(created_at__date=local_date)
        .only('id', 'session_id', 'created_at')
        .order_by('created_at', 'id')
    )
    for order in day_orders:
        key = _session_key(order)
        if key not in session_sequence:
            counter += 1
            session_sequence[key] = counter

    daily_map[local_date] = session_sequence
    return session_sequence


def _meal_code(orders):
    meals = set()
    for order in orders:
        if order.order_type != 'package':
            continue
        meal_name = (order.meal_type.name if order.meal_type else '').strip().lower()
        if meal_name:
            meals.add(meal_name)

    if len(meals) == 1:
        only = next(iter(meals))
        return _MEAL_CODE.get(only, 'M')
    return 'M'


def build_order_reference(order, cache=None):
    if not order:
        return ''

    cache = cache or {}
    key = _session_key(order)
    refs = cache.setdefault('references', {})
    if key in refs:
        return refs[key]

    orders = _session_orders(order, cache)
    first = orders[0]
    local_created = timezone.localtime(first.created_at)
    local_date = local_created.date()
    date_part = local_date.strftime('%Y%m%d')

    delivery_code = _TYPE_CODE.get((first.delivery_type or '').lower(), 'T')
    meal_code = _meal_code(orders)

    package_qty = sum(int(o.quantity or 0) for o in orders if o.order_type == 'package')
    item_qty = sum(int(o.quantity or 0) for o in orders if o.order_type == 'item')

    sequence_map = _daily_sequence_map(local_date, cache)
    sequence = sequence_map.get(key, len(sequence_map) + 1)

    ref = f'ORD-{date_part}-{delivery_code}{meal_code}-P{max(package_qty, 0)}-I{max(item_qty, 0)}-S{sequence:02d}'
    refs[key] = ref
    return ref


def _walkin_total_qty(items):
    total = 0
    for entry in items or []:
        try:
            qty = int(entry.get('qty', 0))
        except (TypeError, ValueError, AttributeError):
            qty = 0
        total += max(qty, 0)
    return total


def _walkin_daily_sequence_map(local_date, cache):
    daily_map = cache.setdefault('walkin_daily_sequence', {})
    if local_date in daily_map:
        return daily_map[local_date]

    sequence_map = {}
    counter = 0
    day_bills = (
        Bill.objects.filter(source='walk_in', generated_at__date=local_date)
        .only('id', 'generated_at')
        .order_by('generated_at', 'id')
    )
    for bill in day_bills:
        counter += 1
        sequence_map[bill.id] = counter

    daily_map[local_date] = sequence_map
    return sequence_map


def build_walkin_order_reference(bill, cache=None):
    if not bill:
        return ''
    if bill.order_reference:
        return bill.order_reference

    cache = cache or {}
    refs = cache.setdefault('walkin_references', {})
    key = bill.id or f'walkin-{timezone.localtime(bill.generated_at).isoformat()}'
    if key in refs:
        return refs[key]

    local_created = timezone.localtime(bill.generated_at)
    local_date = local_created.date()
    date_part = local_date.strftime('%Y%m%d')
    total_qty = _walkin_total_qty(bill.items)

    sequence_map = _walkin_daily_sequence_map(local_date, cache)
    sequence = sequence_map.get(bill.id, len(sequence_map) + 1)

    ref = f'ORD-{date_part}-WI-I{max(total_qty, 0)}-S{sequence:02d}'
    refs[key] = ref
    return ref
