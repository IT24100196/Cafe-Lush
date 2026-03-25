from rest_framework import serializers
from datetime import timedelta
from pos.models import Item
from .models import MealType, MealOrder, Student, Notification, MealPackage, Bill, Suggestion


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
        queryset=Item.objects.all(), many=True, required=False, source='items', write_only=True
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
    class Meta:
        model  = Notification
        fields = ['id', 'message', 'is_read', 'created_at', 'order']


class MealOrderSerializer(serializers.ModelSerializer):
    meal_type_name = serializers.CharField(source='meal_type.name', read_only=True)
    student_name   = serializers.CharField(source='student.full_name', read_only=True)
    item_name      = serializers.CharField(source='item.name', read_only=True)
    pickup_time    = serializers.SerializerMethodField()
    package_label  = serializers.SerializerMethodField()
    unit_price     = serializers.SerializerMethodField()

    class Meta:
        model  = MealOrder
        fields = ['id', 'student', 'student_name', 'meal_type', 'meal_type_name',
                  'item', 'item_name', 'order_type', 'order_date', 'preference',
                  'delivery_type', 'quantity', 'delivery_address', 'phone_number',
                  'student_email', 'status', 'session_id', 'pickup_time',
                  'package_label', 'unit_price', 'created_at']
        read_only_fields = ['student', 'status', 'session_id', 'created_at']
        extra_kwargs = {
            'student_email': {'required': False},
            'meal_type':     {'required': False, 'allow_null': True},
            'order_date':    {'required': False},
            'preference':    {'required': False},
        }

    def validate(self, data):
        order_type = data.get('order_type', 'package')
        if order_type == 'item':
            if not data.get('item'):
                raise serializers.ValidationError({'item': 'An item is required for item orders.'})
        else:
            if not data.get('meal_type'):
                raise serializers.ValidationError({'meal_type': 'A meal type is required for package orders.'})
            if data.get('delivery_type') == 'delivery' and not data.get('delivery_address', '').strip():
                raise serializers.ValidationError({'delivery_address': 'A delivery address is required for delivery orders.'})
            if data.get('delivery_type') == 'delivery' and not data.get('phone_number', '').strip():
                raise serializers.ValidationError({'phone_number': 'A phone number is required for delivery orders.'})
        return data

    def get_pickup_time(self, obj):
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


class SuggestionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model  = Suggestion
        fields = ['id', 'student_name', 'message', 'is_read', 'created_at']
        read_only_fields = ['student', 'is_read', 'created_at']


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Bill
        fields = ['id', 'bill_number', 'source', 'customer_name', 'meal_order',
                  'items', 'total_amount', 'sent_to_email', 'generated_at']
