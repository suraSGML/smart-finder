"""Admin configuration for the analytics app."""
from django.contrib import admin
from .models import SearchLog, ProductView, ShopView


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ['query', 'user', 'results_count', 'category_filter', 'created_at']
    list_filter = ['category_filter', 'city_filter']
    search_fields = ['query', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display = ['product', 'shop', 'user', 'created_at']
    list_filter = ['product__category']
    search_fields = ['product__name', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(ShopView)
class ShopViewAdmin(admin.ModelAdmin):
    list_display = ['shop', 'user', 'created_at']
    search_fields = ['shop__name', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
