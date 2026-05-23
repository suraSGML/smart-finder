"""
Serializers for the products app.
"""
from decimal import Decimal
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Product, ShopProduct, PriceHistory


class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer."""

    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    shop_count = serializers.SerializerMethodField()
    tags_list = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    image = serializers.ImageField(
        max_length=255,
        use_url=True,
        required=False,
        allow_null=True,
        help_text='Product image (max 5MB, allowed formats: jpg, jpeg, png, webp)'
    )

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'image', 'brand', 'unit', 'barcode', 'tags', 'tags_list',
            'is_active', 'min_price', 'max_price', 'shop_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_image(self, value):
        """Validate image size and format."""
        if value:
            # Check file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError('Image size cannot exceed 5MB.')
            
            # Check file extension
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    'Invalid image format. Allowed formats: jpg, jpeg, png, webp'
                )
        return value

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True))
    def get_min_price(self, obj):
        return obj.get_min_price()

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True))
    def get_max_price(self, obj):
        return obj.get_max_price()

    @extend_schema_field(serializers.IntegerField())
    def get_shop_count(self, obj):
        return obj.get_shop_count()

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_tags_list(self, obj):
        return obj.get_tags_list()


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight product serializer for listings."""

    min_price = serializers.SerializerMethodField()
    shop_count = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_display',
            'image', 'brand', 'unit', 'min_price', 'shop_count',
        ]

    @extend_schema_field(serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True))
    def get_min_price(self, obj):
        return obj.get_min_price()

    @extend_schema_field(serializers.IntegerField())
    def get_shop_count(self, obj):
        return obj.get_shop_count()


class ShopProductSerializer(serializers.ModelSerializer):
    """Serializer for shop-product relationship."""

    product_detail = ProductListSerializer(source='product', read_only=True)
    shop_detail = serializers.SerializerMethodField()

    class Meta:
        model = ShopProduct
        fields = [
            'id', 'shop', 'shop_detail', 'product', 'product_detail',
            'price', 'availability', 'stock_quantity', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_shop_detail(self, obj):
        from apps.shops.serializers import ShopListSerializer
        return ShopListSerializer(obj.shop).data

    def validate(self, attrs):
        shop = attrs.get('shop') or (self.instance.shop if self.instance else None)
        request = self.context.get('request')
        if request and request.user.role == 'SHOP_OWNER':
            if shop and shop.owner != request.user:
                raise serializers.ValidationError('You can only manage products in your own shop.')
        return attrs


class ShopProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating shop products."""

    class Meta:
        model = ShopProduct
        fields = ['shop', 'product', 'price', 'availability', 'stock_quantity', 'notes']

    def validate(self, attrs):
        request = self.context.get('request')
        shop = attrs.get('shop')
        if request and request.user.role == 'SHOP_OWNER':
            if shop and shop.owner != request.user:
                raise serializers.ValidationError('You can only add products to your own shop.')
        return attrs


class ProductWithShopsSerializer(serializers.ModelSerializer):
    """Product with all shops that carry it."""

    shops = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_display', 'description',
            'image', 'brand', 'unit', 'shops',
        ]

    @extend_schema_field(ShopProductSerializer(many=True))
    def get_shops(self, obj):
        request = self.context.get('request')
        shop_products = obj.shop_products.filter(
            availability=True,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('shop')
        return ShopProductSerializer(shop_products, many=True, context={'request': request}).data


class PriceHistorySerializer(serializers.ModelSerializer):
    """Serializer for price history records."""

    class Meta:
        model = PriceHistory
        fields = ['id', 'old_price', 'new_price', 'changed_at']
        read_only_fields = ['id', 'changed_at']
