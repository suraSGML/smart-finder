"""
Serializers for the analytics app.
"""
from rest_framework import serializers
from .models import SearchLog, ProductView, ShopView


class SearchLogSerializer(serializers.ModelSerializer):
    """Serializer for search logs."""

    username = serializers.CharField(source='user.username', read_only=True, default='Anonymous')

    class Meta:
        model = SearchLog
        fields = ['id', 'username', 'query', 'results_count', 'category_filter', 'city_filter', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductViewSerializer(serializers.ModelSerializer):
    """Serializer for product views."""

    product_name = serializers.CharField(source='product.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True, default='Anonymous')

    class Meta:
        model = ProductView
        fields = ['id', 'product', 'product_name', 'shop', 'username', 'created_at']
        read_only_fields = ['id', 'created_at']


class TrendingProductSerializer(serializers.Serializer):
    """Serializer for trending product data."""

    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    view_count = serializers.IntegerField()
    category = serializers.CharField()


class AnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for analytics dashboard summary."""

    total_searches = serializers.IntegerField()
    total_product_views = serializers.IntegerField()
    total_shop_views = serializers.IntegerField()
    top_queries = serializers.ListField()
    top_products = serializers.ListField()
    top_shops = serializers.ListField()
    searches_today = serializers.IntegerField()
    new_users_today = serializers.IntegerField()


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard data."""

    total_searches = serializers.IntegerField()
    total_product_views = serializers.IntegerField()
    total_shop_views = serializers.IntegerField()
    searches_today = serializers.IntegerField()
    searches_this_week = serializers.IntegerField()
    searches_this_month = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    new_users_this_week = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    top_queries = serializers.ListField()
    top_products = serializers.ListField()
    top_shops = serializers.ListField()
    total_users = serializers.IntegerField()
    user_roles = serializers.DictField()
    total_shops = serializers.IntegerField()
    approved_shops = serializers.IntegerField()
    pending_shops = serializers.IntegerField()
    active_shops = serializers.IntegerField()
    total_products = serializers.IntegerField()
    recent_activity = serializers.DictField()


class ShopOwnerDashboardSerializer(serializers.Serializer):
    """Serializer for shop owner dashboard data."""

    summary = serializers.DictField()
    shops = serializers.ListField()


class UserDashboardSerializer(serializers.Serializer):
    """Serializer for user dashboard data."""

    user = serializers.DictField()
    favorites_count = serializers.IntegerField()
    recent_searches = serializers.ListField()
    recent_views = serializers.ListField()
    saved_shops = serializers.ListField()
