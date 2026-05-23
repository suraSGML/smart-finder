"""
Notification model for the Smart Local Product Finder.
"""
from django.db import models
from apps.users.models import User


class Notification(models.Model):
    """In-app notification for users."""

    class NotificationType(models.TextChoices):
        PRICE_DROP = 'PRICE_DROP', 'Price Drop'
        BACK_IN_STOCK = 'BACK_IN_STOCK', 'Back in Stock'
        NEW_SHOP = 'NEW_SHOP', 'New Shop Nearby'
        TRENDING = 'TRENDING', 'Trending Product'
        SHOP_APPROVED = 'SHOP_APPROVED', 'Shop Approved'
        SHOP_REJECTED = 'SHOP_REJECTED', 'Shop Rejected'
        NEW_REVIEW = 'NEW_REVIEW', 'New Review'
        SYSTEM = 'SYSTEM', 'System Message'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    is_read = models.BooleanField(default=False)

    # Optional reference to related objects
    related_product_id = models.PositiveIntegerField(null=True, blank=True)
    related_shop_id = models.PositiveIntegerField(null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self):
        return f'{self.user.username}: {self.title}'

    @classmethod
    def send_to_user(cls, user, title, message, notification_type='SYSTEM', **kwargs):
        """Helper to create a notification for a user."""
        return cls.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            **kwargs,
        )

    @classmethod
    def send_bulk(cls, users, title, message, notification_type='SYSTEM'):
        """Send the same notification to multiple users."""
        notifications = [
            cls(user=user, title=title, message=message, notification_type=notification_type)
            for user in users
        ]
        return cls.objects.bulk_create(notifications)
