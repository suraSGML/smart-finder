"""
Serializers for the notifications app.
"""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""

    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True,
    )

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type',
            'notification_type_display', 'is_read',
            'related_product_id', 'related_shop_id', 'action_url',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications (admin use)."""

    class Meta:
        model = Notification
        fields = [
            'user', 'title', 'message', 'notification_type',
            'related_product_id', 'related_shop_id', 'action_url',
        ]
