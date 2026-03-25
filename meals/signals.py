from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import MealOrder

ORDERS_GROUP = 'orders_room'


def _order_payload(order):
    meal_name = order.meal_type.name if order.meal_type else None
    pref      = order.preference or ''
    if order.order_type == 'item':
        package_label = order.item.name if order.item else ''
    elif pref == 'veg':
        package_label = f'Veg {meal_name}' if meal_name else 'Package'
    elif pref == 'non-veg':
        package_label = f'Non-Veg {meal_name}' if meal_name else 'Package'
    else:
        package_label = meal_name or 'Package'

    return {
        'id':             order.id,
        'student_name':   order.student.full_name,
        'student_email':  order.student_email,
        'order_type':     order.order_type,
        'meal_type_name': meal_name,
        'item_name':      order.item.name if order.item else None,
        'preference':     pref,
        'package_label':  package_label,
        'quantity':       order.quantity,
        'delivery_type':  order.delivery_type,
        'delivery_address': order.delivery_address,
        'phone_number':   order.phone_number,
        'status':         order.status,
        'session_id':     order.session_id,
        'order_date':     str(order.order_date),
        'created_at':     order.created_at.isoformat(),
    }


@receiver(post_save, sender=MealOrder)
def broadcast_order(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    payload = _order_payload(instance)
    msg_type = 'new_order' if created else 'order_updated'

    async_to_sync(channel_layer.group_send)(
        ORDERS_GROUP,
        {'type': msg_type, 'order': payload},
    )
