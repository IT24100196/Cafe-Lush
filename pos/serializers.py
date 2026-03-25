from rest_framework import serializers
from .models import Category, Item, PosOrder, PosOrderItem, FeaturedItem, WeeklyMealPlan


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url     = serializers.SerializerMethodField()

    class Meta:
        model  = Item
        fields = ['id', 'item_id', 'category', 'category_name', 'name', 'price',
                  'is_available', 'image', 'image_url', 'created_at']
        extra_kwargs = {'image': {'required': False, 'allow_null': True}, 'item_id': {'required': False}}

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class PosOrderItemInputSerializer(serializers.Serializer):
    id       = serializers.PrimaryKeyRelatedField(queryset=Item.objects.filter(is_available=True), source='item')
    quantity = serializers.IntegerField(min_value=1)


class PosOrderItemSerializer(serializers.ModelSerializer):
    item_name  = serializers.CharField(source='item.name', read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model  = PosOrderItem
        fields = ['id', 'item', 'item_name', 'quantity', 'unit_price', 'line_total']

    def get_line_total(self, obj):
        return obj.quantity * obj.unit_price


class PosOrderSerializer(serializers.ModelSerializer):
    order_items  = PosOrderItemSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True)

    class Meta:
        model  = PosOrder
        fields = ['id', 'bill_id', 'cashier', 'cashier_name', 'total_amount', 'status', 'created_at', 'order_items']


class WeeklyMealPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WeeklyMealPlan
        fields = ['id', 'day_of_week', 'meal_time', 'meal_category', 'dishes', 'price', 'updated_at']


class FeaturedItemSerializer(serializers.ModelSerializer):
    item    = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(), source='item', write_only=True
    )

    class Meta:
        model  = FeaturedItem
        fields = ['id', 'item', 'item_id', 'position', 'created_at']

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['item'] = ItemSerializer(instance.item, context=self.context).data
        return rep


class CreatePosOrderSerializer(serializers.Serializer):
    items = PosOrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value
