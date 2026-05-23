"""
Serializers for the reviews app.
"""
from rest_framework import serializers
from .models import Review
from apps.users.serializers import UserProfileSerializer


class ReviewSerializer(serializers.ModelSerializer):
    """Full review serializer."""

    user_detail = UserProfileSerializer(source='user', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_detail', 'shop', 'shop_name',
            'rating', 'comment', 'is_verified_purchase',
            'helpful_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'helpful_count', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        shop = attrs.get('shop')
        if request and shop:
            # Check for existing review (for create only)
            if not self.instance:
                if Review.objects.filter(user=request.user, shop=shop).exists():
                    raise serializers.ValidationError(
                        'You have already reviewed this shop. Edit your existing review.'
                    )
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a review."""

    class Meta:
        model = Review
        fields = ['shop', 'rating', 'comment']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        shop = attrs.get('shop')
        if request and shop:
            if Review.objects.filter(user=request.user, shop=shop).exists():
                raise serializers.ValidationError(
                    {'non_field_errors': ['You have already reviewed this shop.']}
                )
        return attrs

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReviewUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a review."""

    class Meta:
        model = Review
        fields = ['rating', 'comment']
