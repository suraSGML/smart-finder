"""
Custom User model for Smart Local Product Finder.
Supports customers, shop owners, and admins.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class Favorite(models.Model):
    """A product saved as favourite by a user."""
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='favorites',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='favorited_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} ♥ {self.product.name}'


class PriceAlert(models.Model):
    """Alert for when a product price drops below a threshold."""

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='price_alerts',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='price_alerts',
    )
    target_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text='Alert when price drops below this amount (ETB)',
    )
    is_active = models.BooleanField(default=True)
    is_triggered = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['is_triggered']),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.product.name} @ ETB {self.target_price}'

    def check_alert(self, current_price):
        """Check if current price triggers the alert."""
        if not self.is_active or self.is_triggered:
            return False
        return current_price <= self.target_price


class User(AbstractUser):
    """Extended user model with role-based access and location support."""

    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        SHOP_OWNER = 'SHOP_OWNER', 'Shop Owner'
        ADMIN = 'ADMIN', 'Admin'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+251912345678'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        unique=True,
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='User current latitude for location-based search',
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text='User current longitude for location-based search',
    )

    profile_picture = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True,
    )

    is_verified = models.BooleanField(
        default=False,
        help_text='Whether the user has verified their phone/email',
    )

    bio = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_shop_owner(self):
        return self.role == self.Role.SHOP_OWNER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    def get_full_name(self):
        full_name = super().get_full_name()
        return full_name if full_name.strip() else self.username
