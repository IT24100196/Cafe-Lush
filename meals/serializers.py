from rest_framework import serializers
from datetime import timedelta
from django.core.exceptions import ValidationError as DjangoValidationError
from hotel_pos_backend.media_utils import build_existing_media_url
from hotel_pos_backend.validators import validate_generic_email_format, validate_sri_lankan_mobile
from pos.models import Item, MenuItem, ItemVariant
from .delivery import (
    LOCATION_SOURCE_ADDRESS,
    LOCATION_SOURCE_CURRENT,
    build_delivery_address,
    normalize_coordinate,
    resolve_delivery_area,
)
from .order_reference import build_order_reference, build_walkin_order_reference
from .models import MealType, MealOrder, Student, Notification, MealPackage, Bill, Suggestion


PACKAGE_READY_TIMES = {
    'breakfast': '07:30 AM',
    'lunch': '12:30 PM',
    'dinner': '07:00 PM',
}
MAX_PACKAGE_QUANTITY = 10


def get_package_ready_time(meal_type):
    meal_name = (getattr(meal_type, 'name', '') or '').strip().lower()
    return PACKAGE_READY_TIMES.get(meal_name)


def get_meal_order_item_label(order):
    if getattr(order, 'order_type', '') != 'item':
        return ''

    snapshot = (getattr(order, 'item_name_snapshot', '') or '').strip()
    if snapshot:
        return snapshot

    variant = getattr(order, 'item_variant', None)
    menu_item = getattr(order, 'menu_item', None)
    legacy_item = getattr(order, 'item', None)

    if variant and menu_item:
        group_name = getattr(getattr(menu_item, 'menu_group', None), 'name', '') or ''
        group_label = 'Shake' if group_name == 'Shakes' else group_name
        base_name = (menu_item.name or '').strip()
        base_lower = base_name.lower()
        group_lower = group_label.lower()
        full_base_name = f'{base_name} {group_label}'.strip() if group_label and group_lower not in base_lower else base_name
        return f'{full_base_name} - {variant.name}'
    if menu_item:
        return menu_item.name
    if legacy_item:
        return legacy_item.name
    return 'Menu item'


def get_meal_order_item_unit_price(order):
    if getattr(order, 'order_type', '') != 'item':
        return 0

    snapshot_price = getattr(order, 'item_price_snapshot', None)
    if snapshot_price not in (None, ''):
        return float(snapshot_price)

    variant = getattr(order, 'item_variant', None)
    menu_item = getattr(order, 'menu_item', None)
    legacy_item = getattr(order, 'item', None)

    if variant:
        return float(variant.price)
    if menu_item:
        return float(menu_item.price)
    if legacy_item:
        return float(legacy_item.price)
    return 0


class MealTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MealType
        fields = '__all__'


class PackageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Item
        fields = ['id', 'name', 'price', 'category']


class StudentItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemVariant
        fields = ['id', 'name', 'price', 'is_active']


class StudentMenuItemSerializer(serializers.ModelSerializer):
    menu_group_name = serializers.CharField(source='menu_group.name', read_only=True)
    category = serializers.IntegerField(source='menu_group.category_id', read_only=True)
    category_name = serializers.CharField(source='menu_group.category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    variants = StudentItemVariantSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'menu_group', 'menu_group_name', 'category', 'category_name',
            'item_id', 'name', 'price', 'image_url', 'variants',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        return build_existing_media_url(obj.image, request)


class MealPackageSerializer(serializers.ModelSerializer):
    items_detail   = PackageItemSerializer(source='items', many=True, read_only=True)
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    day_label      = serializers.CharField(source='get_day_of_week_display', read_only=True)
    item_ids       = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.filter(is_available=True, category__is_active=True), many=True, required=False, source='items', write_only=True
    )

    class Meta:
        model  = MealPackage
        fields = ['id', 'meal_type', 'meal_type_name', 'day_of_week', 'day_label',
                  'name', 'description', 'is_veg', 'item_ids', 'items_detail', 'updated_at']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Student
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    order_detail = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'order', 'order_detail']

    def _format_order_label(self, order):
        if order.order_type == 'item':
            return get_meal_order_item_label(order)

        meal_name = order.meal_type.name if order.meal_type else 'Meal package'
        if order.preference == 'veg':
            return f'Veg {meal_name}'
        if order.preference == 'non-veg':
            return f'Non-Veg {meal_name}'
        return meal_name

    def get_order_detail(self, obj):
        order = obj.order
        if not order:
            return None

        cache = self.context.setdefault('_order_reference_cache', {})
        session_cache = self.context.setdefault('_notification_session_cache', {})
        session_key = order.session_id or f'order-{order.id}'

        if session_key not in session_cache:
            if order.session_id:
                session_orders = list(
                    MealOrder.objects.filter(session_id=order.session_id)
                    .select_related('meal_type', 'item', 'menu_item', 'item_variant', 'bill')
                    .order_by('created_at', 'id')
                )
            else:
                session_orders = [order]

            package_order = next((item for item in session_orders if item.order_type == 'package'), None)
            item_orders = [item for item in session_orders if item.order_type == 'item']
            anchor_order = package_order or session_orders[0]
            bill = (
                Bill.objects.filter(source='online', meal_order__session_id=order.session_id).first()
                if order.session_id else getattr(anchor_order, 'bill', None)
            )

            line_items = []
            total_quantity = 0
            for session_order in session_orders:
                label = self._format_order_label(session_order)
                qty = session_order.quantity or 0
                total_quantity += qty
                unit_price = get_meal_order_item_unit_price(session_order) if session_order.order_type == 'item' else 0
                if session_order.order_type == 'package':
                    unit_price = session_order.meal_type.price if session_order.meal_type and hasattr(session_order.meal_type, 'price') else 0
                line_items.append({
                    'id': session_order.id,
                    'label': label,
                    'kind': 'Menu item' if session_order.order_type == 'item' else 'Meal package',
                    'quantity': qty,
                    'order_date': session_order.order_date,
                    'unit_price': unit_price,
                })

            if package_order and item_orders:
                order_kind = 'Combined order'
                summary_label = f'{self._format_order_label(package_order)} + {len(item_orders)} menu item{"s" if len(item_orders) != 1 else ""}'
                pickup_time = get_package_ready_time(package_order.meal_type)
            elif package_order:
                order_kind = 'Meal package'
                summary_label = self._format_order_label(package_order)
                pickup_time = get_package_ready_time(package_order.meal_type)
            else:
                order_kind = 'Menu item'
                summary_label = self._format_order_label(anchor_order)
                pickup_time = None

            session_cache[session_key] = {
                'anchor_order': anchor_order,
                'bill': bill,
                'order_kind': order_kind,
                'summary_label': summary_label,
                'line_items': line_items,
                'total_quantity': total_quantity,
                'pickup_time': pickup_time,
            }

        session_detail = session_cache[session_key]
        anchor_order = session_detail['anchor_order']
        bill = session_detail['bill']

        return {
            'id': anchor_order.id,
            'order_reference': build_order_reference(anchor_order, cache=cache),
            'bill_number': bill.bill_number if bill else '',
            'status': anchor_order.status,
            'order_type': anchor_order.order_type,
            'order_kind': session_detail['order_kind'],
            'name': self._format_order_label(anchor_order),
            'label': session_detail['summary_label'],
            'quantity': anchor_order.quantity,
            'total_quantity': session_detail['total_quantity'],
            'order_date': anchor_order.order_date,
            'preference': anchor_order.preference,
            'delivery_type': anchor_order.delivery_type,
            'delivery_address': bill.delivery_address if bill else anchor_order.delivery_address,
            'phone_number': bill.phone_number if bill else anchor_order.phone_number,
            'student_email': bill.sent_to_email if bill else anchor_order.student_email,
            'delivery_fee': bill.delivery_fee if bill else anchor_order.delivery_fee,
            'subtotal_amount': bill.subtotal_amount if bill else '',
            'total_amount': bill.total_amount if bill else '',
            'unit_price': 0,
            'pickup_time': session_detail['pickup_time'],
            'created_at': anchor_order.created_at,
            'session_lines': session_detail['line_items'],
        }


class MealOrderSerializer(serializers.ModelSerializer):
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    student_name   = serializers.CharField(source='student.full_name', read_only=True)
    item_name      = serializers.SerializerMethodField()
    pickup_time    = serializers.SerializerMethodField()
    package_label  = serializers.SerializerMethodField()
    unit_price     = serializers.SerializerMethodField()
    order_reference = serializers.SerializerMethodField()
    bill_number    = serializers.SerializerMethodField()
    menu_item      = serializers.PrimaryKeyRelatedField(
        queryset=MenuItem.objects.filter(is_available=True, menu_group__is_active=True, menu_group__category__is_active=True),
        required=False,
        allow_null=True,
    )
    item_variant   = serializers.PrimaryKeyRelatedField(
        queryset=ItemVariant.objects.filter(is_active=True, item__is_available=True, item__menu_group__is_active=True, item__menu_group__category__is_active=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model  = MealOrder
        fields = ['id', 'student', 'student_name', 'meal_type', 'meal_type_name',
                  'item', 'menu_item', 'item_variant', 'item_name', 'order_type', 'order_date', 'preference',
                  'delivery_type', 'quantity', 'delivery_address',
                  'address_line_1', 'address_line_2', 'city_area', 'location_source',
                  'delivery_latitude', 'delivery_longitude', 'delivery_fee', 'phone_number',
                  'student_email', 'status', 'session_id', 'order_reference', 'bill_number', 'pickup_time',
                  'package_label', 'unit_price', 'cashier_received_at', 'confirmed_at',
                  'completed_at', 'cancelled_at', 'created_at']
        read_only_fields = [
            'student', 'status', 'session_id', 'cashier_received_at',
            'confirmed_at', 'completed_at', 'cancelled_at', 'created_at',
        ]
        extra_kwargs = {
            'student_email': {'required': False},
            'meal_type':     {'required': False, 'allow_null': True},
            'order_date':    {'required': False},
            'preference':    {'required': False},
        }

    def validate_quantity(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Quantity must be greater than 0.')
        return value

    def validate_student_email(self, value):
        try:
            return validate_generic_email_format(value, required=False) or ''
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            raise serializers.ValidationError(message)

    def validate_phone_number(self, value):
        try:
            return validate_sri_lankan_mobile(value, required=False, label='Phone number')
        except DjangoValidationError as exc:
            message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
            raise serializers.ValidationError(message)

    def validate(self, data):
        order_type = data.get('order_type', 'package')
        quantity = data.get('quantity')
        legacy_item = data.get('item')
        menu_item = data.get('menu_item')
        item_variant = data.get('item_variant')
        phone_number = (data.get('phone_number') or '').strip()
        delivery_type = (data.get('delivery_type') or 'takeaway').strip().lower()
        address_line_1 = (data.get('address_line_1') or '').strip()
        address_line_2 = (data.get('address_line_2') or '').strip()
        city_area = (data.get('city_area') or '').strip()
        location_source = (data.get('location_source') or LOCATION_SOURCE_ADDRESS).strip() or LOCATION_SOURCE_ADDRESS
        delivery_address = (data.get('delivery_address') or '').strip()
        delivery_latitude = normalize_coordinate(data.get('delivery_latitude'), 'Latitude')
        delivery_longitude = normalize_coordinate(data.get('delivery_longitude'), 'Longitude')

        data['phone_number'] = phone_number
        data['address_line_1'] = address_line_1
        data['address_line_2'] = address_line_2
        data['city_area'] = city_area
        data['location_source'] = location_source
        data['delivery_latitude'] = delivery_latitude
        data['delivery_longitude'] = delivery_longitude

        if item_variant and not menu_item:
            menu_item = item_variant.item
            data['menu_item'] = menu_item
        if item_variant and menu_item and item_variant.item_id != menu_item.id:
            raise serializers.ValidationError({'item_variant': 'The selected variant does not belong to the selected menu item.'})

        if delivery_type == 'delivery':
            if not address_line_1:
                raise serializers.ValidationError({'address_line_1': 'Address line 1 is required for delivery orders.'})
            if not city_area:
                raise serializers.ValidationError({'city_area': 'Delivery area is required for delivery orders.'})
            try:
                area = resolve_delivery_area(city_area=city_area)
            except DjangoValidationError as exc:
                message = exc.messages[0] if getattr(exc, 'messages', None) else str(exc)
                raise serializers.ValidationError({'city_area': message})
            if city_area.strip().lower() != 'jaffna':
                city_area = area['name']
            data['city_area'] = city_area
            delivery_address = build_delivery_address(address_line_1, address_line_2, city_area)
            if location_source == LOCATION_SOURCE_CURRENT and (delivery_latitude is None or delivery_longitude is None):
                raise serializers.ValidationError({'detail': 'Current location is required to calculate the delivery fee.'})
            if location_source != LOCATION_SOURCE_CURRENT:
                delivery_latitude = None
                delivery_longitude = None
                data['delivery_latitude'] = None
                data['delivery_longitude'] = None
        else:
            location_source = LOCATION_SOURCE_ADDRESS
            delivery_latitude = None
            delivery_longitude = None
            data['location_source'] = location_source
            data['delivery_latitude'] = delivery_latitude
            data['delivery_longitude'] = delivery_longitude

        data['delivery_address'] = delivery_address

        if order_type == 'item':
            if not legacy_item and not menu_item:
                raise serializers.ValidationError({'item': 'A menu item is required for item orders.'})
            if not phone_number:
                raise serializers.ValidationError({'phone_number': 'A phone number is required for menu item orders.'})
            if delivery_type == 'delivery' and not delivery_address:
                raise serializers.ValidationError({'delivery_address': 'A delivery address is required for delivery orders.'})
            if menu_item:
                label = get_meal_order_item_label(type('OrderPreview', (), {
                    'order_type': 'item',
                    'item_name_snapshot': '',
                    'item_variant': item_variant,
                    'menu_item': menu_item,
                    'item': None,
                })())
                price = item_variant.price if item_variant else menu_item.price
                data['item_name_snapshot'] = label
                data['item_price_snapshot'] = price
                data['item'] = None
            elif legacy_item:
                data['item_name_snapshot'] = legacy_item.name
                data['item_price_snapshot'] = legacy_item.price
        else:
            if not data.get('meal_type'):
                raise serializers.ValidationError({'meal_type': 'A meal type is required for package orders.'})
            if quantity is not None and quantity > MAX_PACKAGE_QUANTITY:
                raise serializers.ValidationError({
                    'quantity': f'Maximum {MAX_PACKAGE_QUANTITY} packages can be ordered at one time.'
                })
            if not phone_number:
                raise serializers.ValidationError({'phone_number': 'A phone number is required for package orders.'})
            if delivery_type == 'delivery' and not delivery_address:
                raise serializers.ValidationError({'delivery_address': 'A delivery address is required for delivery orders.'})
            if delivery_type == 'delivery' and location_source == LOCATION_SOURCE_CURRENT:
                raise serializers.ValidationError({'location_source': 'Meal package deliveries must use the typed address only.'})
        return data

    def get_item_name(self, obj):
        return get_meal_order_item_label(obj)

    def get_pickup_time(self, obj):
        if obj.order_type == 'package':
            return get_package_ready_time(obj.meal_type)
        if obj.delivery_type != 'takeaway':
            return None
        pickup = obj.created_at + timedelta(minutes=30)
        return pickup.strftime('%I:%M %p')

    def get_unit_price(self, obj):
        if obj.order_type == 'item':
            return get_meal_order_item_unit_price(obj)
        return float(obj.meal_type.price) if obj.meal_type and hasattr(obj.meal_type, 'price') else 0

    def get_package_label(self, obj):
        """Returns e.g. 'Veg Breakfast', 'Non-Veg Dinner', or item name."""
        if obj.order_type == 'item':
            return get_meal_order_item_label(obj)
        meal = obj.meal_type.name if obj.meal_type else 'Package'
        if obj.preference == 'veg':
            return f'Veg {meal}'
        if obj.preference == 'non-veg':
            return f'Non-Veg {meal}'
        return meal

    def get_order_reference(self, obj):
        cache = self.context.setdefault('_order_reference_cache', {})
        return build_order_reference(obj, cache=cache)

    def get_bill_number(self, obj):
        bill = getattr(obj, 'bill', None)
        return bill.bill_number if bill else ''


class SuggestionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model  = Suggestion
        fields = ['id', 'student_name', 'message', 'is_read', 'created_at']
        read_only_fields = ['student', 'is_read', 'created_at']


class BillSerializer(serializers.ModelSerializer):
    order_reference = serializers.SerializerMethodField()
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)
    edited_by_name = serializers.CharField(source='edited_by.username', read_only=True)
    is_edited = serializers.SerializerMethodField()

    def get_order_reference(self, obj):
        if obj.order_reference:
            return obj.order_reference
        if obj.source == 'online' and obj.meal_order:
            cache = self.context.setdefault('_order_reference_cache', {})
            return build_order_reference(obj.meal_order, cache=cache)
        if obj.source == 'walk_in':
            cache = self.context.setdefault('_walkin_order_reference_cache', {})
            return build_walkin_order_reference(obj, cache=cache)
        return ''

    def get_is_edited(self, obj):
        return bool(getattr(obj, 'edit_count', 0) or getattr(obj, 'edited_at', None))

    class Meta:
        model  = Bill
        fields = ['id', 'bill_number', 'order_reference', 'source', 'customer_name', 'meal_order',
                  'cashier', 'cashier_name',
                  'items', 'delivery_type', 'delivery_address', 'phone_number',
                  'subtotal_amount', 'delivery_fee', 'total_amount',
                  'original_items', 'original_total_amount',
                  'edited_by', 'edited_by_name', 'edited_at', 'edit_count', 'is_edited',
                  'sent_to_email', 'generated_at']
