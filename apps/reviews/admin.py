"""Admin configuration for the reviews app."""
from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'shop', 'rating', 'helpful_count', 'is_verified_purchase', 'created_at']
    list_filter = ['rating', 'is_verified_purchase']
    search_fields = ['user__username', 'shop__name', 'comment']
    ordering = ['-created_at']
    readonly_fields = ['helpful_count', 'created_at', 'updated_at']
