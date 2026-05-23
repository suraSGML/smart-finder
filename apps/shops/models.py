"""
Shop model for Smart Local Product Finder.
Represents physical stores in Ethiopia.
"""
import math
from django.db import models
from django.db.models import Avg
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import User


class Shop(models.Model):
    """Represents a physical shop/store in Ethiopia."""

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shops',
        limit_choices_to={'role': 'SHOP_OWNER'},
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='shops/logos/', null=True, blank=True)
    cover_image = models.ImageField(upload_to='shops/covers/', null=True, blank=True)

    # Location
    address = models.CharField(max_length=500)
    city = models.CharField(max_length=100, default='Addis Ababa')
    sub_city = models.CharField(max_length=100, blank=True, null=True)
    woreda = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    # Contact
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Business hours (JSON-like text field)
    opening_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='e.g. {"monday": "8:00-20:00", "friday": "8:00-18:00"}',
    )

    # Status
    is_approved = models.BooleanField(
        default=False,
        help_text='Admin must approve before shop is visible',
    )
    is_active = models.BooleanField(default=True)

    # Computed rating (updated via signals/tasks)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    review_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Shop'
        verbose_name_plural = 'Shops'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['city', 'is_approved', 'is_active']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f'{self.name} - {self.city}'

    def calculate_distance(self, user_lat, user_lon):
        """
        Calculate distance from shop to user using the Haversine formula.
        Returns distance in kilometers.
        """
        if not all([self.latitude, self.longitude, user_lat, user_lon]):
            return None

        R = 6371  # Earth's radius in kilometers

        lat1 = math.radians(float(self.latitude))
        lon1 = math.radians(float(self.longitude))
        lat2 = math.radians(float(user_lat))
        lon2 = math.radians(float(user_lon))

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return round(R * c, 2)

    def update_rating(self):
        """Recalculate and save the shop's average rating."""
        from apps.reviews.models import Review
        reviews = Review.objects.filter(shop=self)
        count = reviews.count()
        if count > 0:
            avg = reviews.aggregate(Avg('rating'))['rating__avg']
            self.rating = round(avg, 2)
        else:
            self.rating = 0.00
        self.review_count = count
        self.save(update_fields=['rating', 'review_count'])
