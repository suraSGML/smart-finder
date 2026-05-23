"""
Serializers for the shops app.
"""
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Shop


class ShopSerializer(serializers.ModelSerializer):
    """Full shop serializer with computed fields."""

    owner_detail = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'owner', 'owner_detail', 'name', 'description',
            'logo', 'cover_image', 'address', 'city', 'sub_city', 'woreda',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'opening_hours', 'is_approved', 'is_active', 'rating',
            'review_count', 'product_count', 'distance', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'is_approved', 'rating', 'review_count', 'created_at', 'updated_at']

    def get_owner_detail(self, obj):
        from apps.users.serializers import UserProfileSerializer
        return UserProfileSerializer(obj.owner).data

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_distance(self, obj):
        request = self.context.get('request')
        if request:
            user_lat = request.query_params.get('lat') or (
                request.user.latitude if request.user.is_authenticated else None
            )
            user_lon = request.query_params.get('lon') or (
                request.user.longitude if request.user.is_authenticated else None
            )
            if user_lat and user_lon:
                return obj.calculate_distance(user_lat, user_lon)
        return None

    @extend_schema_field(serializers.IntegerField())
    def get_product_count(self, obj):
        return obj.shop_products.filter(availability=True).count()


class ShopCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating a shop."""

    logo = serializers.ImageField(
        max_length=255,
        use_url=True,
        required=False,
        allow_null=True,
        help_text='Shop logo (max 5MB, allowed formats: jpg, jpeg, png, webp)'
    )
    cover_image = serializers.ImageField(
        max_length=255,
        use_url=True,
        required=False,
        allow_null=True,
        help_text='Shop cover image (max 5MB, allowed formats: jpg, jpeg, png, webp)'
    )

    class Meta:
        model = Shop
        fields = [
            'name', 'description', 'logo', 'cover_image',
            'address', 'city', 'sub_city', 'woreda',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'opening_hours',
        ]

    def validate_logo(self, value):
        """Validate logo size and format."""
        if value:
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError('Logo size cannot exceed 5MB.')
            
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    'Invalid logo format. Allowed formats: jpg, jpeg, png, webp'
                )
        return value

    def validate_cover_image(self, value):
        """Validate cover image size and format."""
        if value:
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError('Cover image size cannot exceed 5MB.')
            
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in valid_extensions:
                raise serializers.ValidationError(
                    'Invalid cover image format. Allowed formats: jpg, jpeg, png, webp'
                )
        return value

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ShopListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for shop listings."""

    distance = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'logo', 'address', 'city',
            'latitude', 'longitude', 'rating', 'review_count',
            'is_approved', 'is_active', 'distance', 'owner_name',
        ]

    @extend_schema_field(serializers.FloatField(allow_null=True))
    def get_distance(self, obj):
        request = self.context.get('request')
        if request:
            user_lat = request.query_params.get('lat')
            user_lon = request.query_params.get('lon')
            if not (user_lat and user_lon) and request.user.is_authenticated:
                user_lat = request.user.latitude
                user_lon = request.user.longitude
            if user_lat and user_lon:
                return obj.calculate_distance(user_lat, user_lon)
        return None

    @extend_schema_field(serializers.CharField())
    def get_owner_name(self, obj):
        return obj.owner.get_full_name()


class ShopApprovalSerializer(serializers.ModelSerializer):
    """Serializer for admin shop approval."""

    class Meta:
        model = Shop
        fields = ['id', 'is_approved', 'is_active']
