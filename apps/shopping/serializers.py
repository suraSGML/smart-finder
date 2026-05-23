"""
Serializers for the shopping app.
"""
from rest_framework import serializers
from .models import ShoppingList, ShoppingListItem
from apps.products.serializers import ProductListSerializer, ShopProductSerializer


class ShoppingListItemSerializer(serializers.ModelSerializer):
    """Serializer for shopping list items."""

    product_detail = ProductListSerializer(source='product', read_only=True)
    shop_product_detail = ShopProductSerializer(source='shop_product', read_only=True)
    estimated_price = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingListItem
        fields = [
            'id', 'shopping_list', 'product', 'product_detail',
            'shop_product', 'shop_product_detail', 'quantity',
            'notes', 'is_completed', 'estimated_price',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_estimated_price(self, obj):
        return obj.get_estimated_price()

    def validate(self, attrs):
        """Ensure either product or shop_product is provided."""
        product = attrs.get('product')
        shop_product = attrs.get('shop_product')
        
        if not product and not shop_product:
            raise serializers.ValidationError(
                'Either product or shop_product must be provided.'
            )
        
        if shop_product and not product:
            attrs['product'] = shop_product.product
        
        return attrs


class ShoppingListItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shopping list items."""

    class Meta:
        model = ShoppingListItem
        fields = ['product', 'shop_product', 'quantity', 'notes', 'is_completed']


class ShoppingListSerializer(serializers.ModelSerializer):
    """Serializer for shopping lists."""

    items = ShoppingListItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_estimated_cost = serializers.SerializerMethodField()
    completed_items = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingList
        fields = [
            'id', 'user', 'name', 'notes', 'is_active',
            'items', 'total_items', 'total_estimated_cost',
            'completed_items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_total_items(self, obj):
        return obj.get_total_items()

    def get_total_estimated_cost(self, obj):
        return obj.get_total_estimated_cost()

    def get_completed_items(self, obj):
        return obj.get_completed_items()


class ShoppingListCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating shopping lists."""

    class Meta:
        model = ShoppingList
        fields = ['name', 'notes', 'is_active']


class ShoppingListUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating shopping lists."""

    class Meta:
        model = ShoppingList
        fields = ['name', 'notes', 'is_active']
