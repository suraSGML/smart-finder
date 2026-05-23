"""
Analytics models for tracking searches and product views.
"""
from django.db import models
from apps.users.models import User
from apps.products.models import Product
from apps.shops.models import Shop


class SearchLog(models.Model):
    """Logs every search query for analytics and trending detection."""

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_logs',
    )
    query = models.CharField(max_length=500)
    results_count = models.PositiveIntegerField(default=0)
    category_filter = models.CharField(max_length=50, blank=True, null=True)
    city_filter = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Search Log'
        verbose_name_plural = 'Search Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['query']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'Anonymous'
        return f'{user_str}: "{self.query}" ({self.results_count} results)'


class ProductView(models.Model):
    """Tracks product page views for popularity analytics."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='views',
    )
    shop = models.ForeignKey(
        Shop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_views',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_views',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product View'
        verbose_name_plural = 'Product Views'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'created_at']),
        ]

    def __str__(self):
        user_str = self.user.username if self.user else 'Anonymous'
        return f'{user_str} viewed {self.product.name}'


class ShopView(models.Model):
    """Tracks shop page views."""

    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='shop_views',
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shop_views',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Shop View'
        verbose_name_plural = 'Shop Views'
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else 'Anonymous'
        return f'{user_str} viewed {self.shop.name}'
