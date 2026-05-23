"""Admin configuration for the shops app."""
from django.contrib import admin
from .models import Shop


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'owner', 'city', 'is_approved', 'is_active',
        'rating', 'review_count', 'created_at',
    ]
    list_filter = ['is_approved', 'is_active', 'city']
    search_fields = ['name', 'owner__username', 'owner__email', 'address']
    ordering = ['-created_at']
    readonly_fields = ['rating', 'review_count', 'created_at', 'updated_at']

    actions = ['approve_shops', 'reject_shops']

    def approve_shops(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f'{queryset.count()} shop(s) approved.')
    approve_shops.short_description = 'Approve selected shops'

    def reject_shops(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, f'{queryset.count()} shop(s) rejected.')
    reject_shops.short_description = 'Reject selected shops'
