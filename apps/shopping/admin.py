"""
Admin configuration for shopping app.
"""
from django.contrib import admin
from .models import ShoppingList, ShoppingListItem


class ShoppingListItemInline(admin.TabularInline):
    """Inline admin for shopping list items."""
    model = ShoppingListItem
    extra = 1
    fields = ['product', 'shop_product', 'quantity', 'is_completed']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ShoppingList)
class ShoppingListAdmin(admin.ModelAdmin):
    """Admin interface for shopping lists."""
    list_display = ['name', 'user', 'total_items', 'total_estimated_cost', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'user__username', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ShoppingListItemInline]
    
    def total_items(self, obj):
        return obj.get_total_items()
    total_items.short_description = 'Total Items'
    
    def total_estimated_cost(self, obj):
        return f'ETB {obj.get_total_estimated_cost():.2f}'
    total_estimated_cost.short_description = 'Estimated Cost'


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    """Admin interface for shopping list items."""
    list_display = ['shopping_list', 'product', 'quantity', 'is_completed', 'estimated_price', 'created_at']
    list_filter = ['is_completed', 'created_at']
    search_fields = ['shopping_list__name', 'product__name', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    
    def estimated_price(self, obj):
        return f'ETB {obj.get_estimated_price():.2f}'
    estimated_price.short_description = 'Estimated Price'
