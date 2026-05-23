"""
Product and ShopProduct models for Smart Local Product Finder.
"""
from django.db import models
from django.core.validators import MinValueValidator
from apps.shops.models import Shop


class Product(models.Model):
    """A generic product that can be sold in multiple shops."""

    class Category(models.TextChoices):
        ELECTRONICS = 'ELECTRONICS', 'Electronics'
        FOOD = 'FOOD', 'Food & Groceries'
        CLOTHING = 'CLOTHING', 'Clothing & Fashion'
        HOUSEHOLD = 'HOUSEHOLD', 'Household Items'
        HEALTH = 'HEALTH', 'Health & Beauty'
        AUTOMOTIVE = 'AUTOMOTIVE', 'Automotive'
        SPORTS = 'SPORTS', 'Sports & Fitness'
        BOOKS = 'BOOKS', 'Books & Stationery'
        AGRICULTURE = 'AGRICULTURE', 'Agriculture'
        OTHER = 'OTHER', 'Other'

    name = models.CharField(max_length=300)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    brand = models.CharField(max_length=200, blank=True, null=True)
    unit = models.CharField(
        max_length=50,
        default='piece',
        help_text='e.g. kg, liter, piece, pack',
    )
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)

    # SEO / search
    tags = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text='Comma-separated tags for search',
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['name']),
            models.Index(fields=['brand']),
            models.Index(fields=['barcode']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_category_display()})'

    def get_tags_list(self):
        if self.tags:
            return [t.strip() for t in self.tags.split(',')]
        return []

    def get_min_price(self):
        """Return the minimum price across all shops."""
        prices = self.shop_products.filter(availability=True).values_list('price', flat=True)
        return min(prices) if prices else None

    def get_max_price(self):
        """Return the maximum price across all shops."""
        prices = self.shop_products.filter(availability=True).values_list('price', flat=True)
        return max(prices) if prices else None

    def get_shop_count(self):
        """Return the number of shops carrying this product."""
        return self.shop_products.filter(availability=True).count()


class PriceHistory(models.Model):
    """Tracks every price change for a ShopProduct over time."""

    shop_product = models.ForeignKey(
        'ShopProduct',
        on_delete=models.CASCADE,
        related_name='price_history',
    )
    old_price = models.DecimalField(max_digits=12, decimal_places=2)
    new_price = models.DecimalField(max_digits=12, decimal_places=2)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        indexes = [models.Index(fields=['shop_product', 'changed_at'])]

    def __str__(self):
        return f'{self.shop_product} {self.old_price}→{self.new_price}'


class ShopProduct(models.Model):
    """Links a product to a specific shop with pricing and availability."""

    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='shop_products',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='shop_products',
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Price in Ethiopian Birr (ETB)',
    )
    availability = models.BooleanField(
        default=True,
        help_text='Whether the product is currently in stock',
    )
    stock_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Current stock quantity (optional)',
    )
    notes = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        help_text='e.g. "Imported", "Local brand", "Expires soon"',
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Shop Product'
        verbose_name_plural = 'Shop Products'
        unique_together = ('shop', 'product')
        ordering = ['price']
        indexes = [
            models.Index(fields=['shop', 'availability']),
            models.Index(fields=['product', 'availability']),
            models.Index(fields=['price']),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.price < 0:
            raise ValidationError({'price': 'Price cannot be negative.'})
        if self.stock_quantity is not None and self.stock_quantity < 0:
            raise ValidationError({'stock_quantity': 'Stock quantity cannot be negative.'})

    def __str__(self):
        return f'{self.product.name} @ {self.shop.name} - ETB {self.price}'
