from rest_framework import serializers
from datetime import timedelta
from django.core.exceptions import ValidationError as DjangoValidationError
from pos.models import Item
from hotel_pos_backend.validators import validate_generic_email_format, validate_sri_lankan_mobile
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
    'dinner': '07:00 PM',
}
MAX_PACKAGE_QUANTITY = 10


def get_package_ready_time(meal_type):
    meal_name = (getattr(meal_type, 'name', '') or '').strip().lower()
    return PACKAGE_READY_TIMES.get(meal_name)


class MealTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MealType
        fields = '__all__'


class PackageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Item
        fields = ['id', 'name', 'price', 'category']


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

    def get_order_detail(self, obj):
        order = obj.order
        if not order:
            return None

        if order.order_type == 'item':
            order_name = order.item.name if order.item else 'Menu item'
            order_label = order_name
            order_kind = 'Menu item'
            pickup_time = None
            unit_price = order.item.price if order.item else 0
        else:
            meal_name = order.meal_type.name if order.meal_type else 'Meal package'
            if order.preference == 'veg':
                order_label = f'Veg {meal_name}'
            elif order.preference == 'non-veg':
                order_label = f'Non-Veg {meal_name}'
            else:
                order_label = meal_name
            order_name = meal_name
            order_kind = 'Meal package'
            pickup_time = get_package_ready_time(order.meal_type)
            unit_price = order.meal_type.price if order.meal_type and hasattr(order.meal_type, 'price') else 0

        bill = getattr(order, 'bill', None)
        cache = self.context.setdefault('_order_reference_cache', {})

        return {
            'id': order.id,
            'order_reference': build_order_reference(order, cache=cache),
            'bill_number': bill.bill_number if bill else '',
            'status': order.status,
            'order_type': order.order_type,
            'order_kind': order_kind,
            'name': order_name,
            'label': order_label,
            'quantity': order.quantity,
            'order_date': order.order_date,
            'preference': order.preference,
            'delivery_type': order.delivery_type,
            'delivery_address': order.delivery_address,
            'phone_number': order.phone_number,
            'student_email': order.student_email,
            'delivery_fee': order.delivery_fee,
            'unit_price': unit_price,
            'pickup_time': pickup_time,
            'created_at': order.created_at,
        }


class MealOrderSerializer(serializers.ModelSerializer):
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    student_name   = serializers.CharField(source='student.full_name', read_only=True)
    item_name      = serializers.CharField(source='item.name', read_only=True)
    pickup_time    = serializers.SerializerMethodField()
    package_label  = serializers.SerializerMethodField()
    unit_price     = serializers.SerializerMethodField()
    order_reference = serializers.SerializerMethodField()
    bill_number    = serializers.SerializerMethodField()

    class Meta:
        model  = MealOrder
        fields = ['id', 'student', 'student_name', 'meal_type', 'meal_type_name',
                  'item', 'item_name', 'order_type', 'order_date', 'preference',
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
            if not data.get('item'):
                raise serializers.ValidationError({'item': 'An item is required for item orders.'})
            if not phone_number:
                raise serializers.ValidationError({'phone_number': 'A phone number is required for menu item orders.'})
            if delivery_type == 'delivery' and not delivery_address:
                raise serializers.ValidationError({'delivery_address': 'A delivery address is required for delivery orders.'})
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

    def get_pickup_time(self, obj):
        if obj.order_type == 'package':
            return get_package_ready_time(obj.meal_type)
        if obj.delivery_type != 'takeaway':
            return None
        pickup = obj.created_at + timedelta(minutes=30)
        return pickup.strftime('%I:%M %p')

    def get_unit_price(self, obj):
        if obj.order_type == 'item':
            return float(obj.item.price) if obj.item else 0
        return float(obj.meal_type.price) if obj.meal_type and hasattr(obj.meal_type, 'price') else 0

    def get_package_label(self, obj):
        """Returns e.g. 'Veg Breakfast', 'Non-Veg Dinner', or item name."""
        if obj.order_type == 'item':
            return obj.item.name if obj.item else ''
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

    class Meta:
        model  = Bill
        fields = ['id', 'bill_number', 'order_reference', 'source', 'customer_name', 'meal_order',
                  'cashier', 'cashier_name',
                  'items', 'delivery_type', 'delivery_address', 'phone_number',
                  'subtotal_amount', 'delivery_fee', 'total_amount', 'sent_to_email', 'generated_at']
