"""
Serializers for the users app.
Handles registration, login, and profile management.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema_field

from .models import User, Favorite, PriceAlert


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'role', 'password', 'password_confirm',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login - returns JWT tokens."""

    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        # Allow login with email as well
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials.')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        attrs['user'] = user
        return attrs

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for viewing and updating user profile."""

    full_name = serializers.SerializerMethodField()
    shop_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone_number', 'role', 'latitude', 'longitude',
            'profile_picture', 'is_verified', 'bio', 'shop_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'username', 'role', 'is_verified', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj):
        return obj.get_full_name()

    @extend_schema_field(serializers.IntegerField())
    def get_shop_count(self, obj):
        if obj.is_shop_owner:
            return obj.shops.count()
        return 0


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number',
            'latitude', 'longitude', 'profile_picture', 'bio',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'New passwords do not match.'})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset token."""
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError('No active account found with this email.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset with token."""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'role', 'is_active', 'is_verified',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for favorite products."""

    product_detail = serializers.SerializerMethodField()

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'product_detail', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_product_detail(self, obj):
        from apps.products.serializers import ProductListSerializer
        return ProductListSerializer(obj.product).data


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a favorite."""

    class Meta:
        model = Favorite
        fields = ['product']


class PriceAlertSerializer(serializers.ModelSerializer):
    """Serializer for price alerts."""

    product_detail = serializers.SerializerMethodField()
    current_min_price = serializers.SerializerMethodField()

    class Meta:
        model = PriceAlert
        fields = [
            'id', 'user', 'product', 'product_detail', 'target_price',
            'is_active', 'is_triggered', 'triggered_at', 'current_min_price',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'is_triggered', 'triggered_at', 'created_at', 'updated_at']

    def get_product_detail(self, obj):
        from apps.products.serializers import ProductListSerializer
        return ProductListSerializer(obj.product).data

    def get_current_min_price(self, obj):
        return obj.product.get_min_price()


class PriceAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a price alert."""

    class Meta:
        model = PriceAlert
        fields = ['product', 'target_price']

    def validate_target_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Target price must be greater than 0.')
        return value


class PriceAlertUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a price alert."""

    class Meta:
        model = PriceAlert
        fields = ['target_price', 'is_active']
