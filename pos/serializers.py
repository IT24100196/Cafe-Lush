from rest_framework import serializers
from hotel_pos_backend.media_utils import build_existing_media_url
from .models import (
    Category, CatalogCategory, MenuGroup, MenuItem, ItemVariant,
    Item, PosOrder, PosOrderItem, FeaturedItem, WeeklyMealPlan,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = '__all__'


class CatalogCategorySerializer(serializers.ModelSerializer):
    menu_group_count = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = CatalogCategory
        fields = ['id', 'name', 'is_active', 'menu_group_count', 'item_count']

    def get_menu_group_count(self, obj):
        return getattr(obj, 'menu_group_count', obj.menu_groups.count())

    def get_item_count(self, obj):
        return getattr(obj, 'item_count', MenuItem.objects.filter(menu_group__category=obj).count())


class MenuGroupSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuGroup
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'is_active', 'item_count',
        ]

    def get_item_count(self, obj):
        return getattr(obj, 'item_count', obj.items.count())


class ItemVariantSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = ItemVariant
        fields = ['id', 'item', 'item_name', 'name', 'price', 'is_active', 'created_at']

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Price must be greater than 0.')
        return value


class MenuItemSerializer(serializers.ModelSerializer):
    menu_group_name = serializers.CharField(source='menu_group.name', read_only=True)
    category = serializers.IntegerField(source='menu_group.category_id', read_only=True)
    category_name = serializers.CharField(source='menu_group.category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    variant_count = serializers.SerializerMethodField()
    variants = ItemVariantSerializer(many=True, read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'menu_group', 'menu_group_name', 'category', 'category_name',
            'item_id', 'name', 'price', 'image', 'image_url', 'is_available',
            'variant_count', 'variants', 'created_at',
        ]
        extra_kwargs = {'image': {'required': False, 'allow_null': True}}

    def get_image_url(self, obj):
        request = self.context.get('request')
        return build_existing_media_url(obj.image, request)

    def get_variant_count(self, obj):
        return getattr(obj, 'variant_count', obj.variants.count())

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Price must be greater than 0.')
        return value


class ItemSerializer(serializers.ModelSerializer):
    category      = serializers.PrimaryKeyRelatedField(queryset=Category.objects.filter(is_active=True))
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url     = serializers.SerializerMethodField()

    class Meta:
        model  = Item
        fields = ['id', 'item_id', 'category', 'category_name', 'name', 'price',
                  'is_available', 'image', 'image_url', 'created_at']
        extra_kwargs = {'image': {'required': False, 'allow_null': True}, 'item_id': {'required': False}}

    def get_image_url(self, obj):
        request = self.context.get('request')
        return build_existing_media_url(obj.image, request)

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Price must be greater than 0.')
        return value


class PosOrderItemInputSerializer(serializers.Serializer):
    id       = serializers.PrimaryKeyRelatedField(queryset=Item.objects.filter(is_available=True, category__is_active=True), source='item')
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

    def validate_day_of_week(self, value):
        if value < 0 or value > 6:
            raise serializers.ValidationError('Day of week must be between 0 (Monday) and 6 (Sunday).')
        return value

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('Price must be greater than 0.')
        return value

    def validate_dishes(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Dishes must be provided as a list.')
        cleaned = [str(d).strip() for d in value if str(d).strip()]
        if not cleaned:
            raise serializers.ValidationError('At least one dish is required.')
        return cleaned


class FeaturedItemSerializer(serializers.ModelSerializer):
    item    = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.filter(is_available=True, category__is_active=True), source='item', write_only=True
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
