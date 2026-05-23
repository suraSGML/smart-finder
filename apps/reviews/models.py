"""
Review model for shop ratings and trust system.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import User
from apps.shops.models import Shop


class Review(models.Model):
    """User review and rating for a shop."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1 (worst) to 5 (best)',
    )
    comment = models.TextField(blank=True, null=True)
    is_verified_purchase = models.BooleanField(
        default=False,
        help_text='Whether the reviewer has actually purchased from this shop',
    )
    helpful_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of users who found this review helpful',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        unique_together = ('user', 'shop')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop', 'rating']),
            models.Index(fields=['shop', 'created_at']),
            models.Index(fields=['user']),
            models.Index(fields=['helpful_count']),
        ]

    def __str__(self):
        return f'{self.user.username} → {self.shop.name}: {self.rating}/5'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update shop rating after saving a review
        self.shop.update_rating()

    def delete(self, *args, **kwargs):
        shop = self.shop
        super().delete(*args, **kwargs)
        shop.update_rating()
