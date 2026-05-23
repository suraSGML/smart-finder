"""Admin configuration for the products app."""
from django.contrib import admin
from .models import Product, ShopProduct


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'unit', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description', 'brand', 'barcode', 'tags']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ShopProduct)
class ShopProductAdmin(admin.ModelAdmin):
    list_display = ['product', 'shop', 'price', 'availability', 'stock_quantity', 'updated_at']
    list_filter = ['availability', 'shop__city']
    search_fields = ['product__name', 'shop__name']
    ordering = ['product__name', 'price']
    readonly_fields = ['created_at', 'updated_at']
