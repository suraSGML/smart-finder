"""
Views for the analytics system.
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiParameter
from rest_framework import serializers as drf_serializers

from .models import SearchLog, ProductView, ShopView
from .serializers import SearchLogSerializer, ProductViewSerializer
from apps.users.permissions import IsAdmin, IsShopOwner
from apps.users.models import User
from apps.shops.models import Shop
from apps.products.models import Product

_admin_summary_serializer = inline_serializer(
    name='AdminAnalyticsSummary',
    fields={
        'total_searches': drf_serializers.IntegerField(),
        'total_product_views': drf_serializers.IntegerField(),
        'total_shop_views': drf_serializers.IntegerField(),
        'searches_today': drf_serializers.IntegerField(),
        'new_users_today': drf_serializers.IntegerField(),
        'total_users': drf_serializers.IntegerField(),
        'total_shops': drf_serializers.IntegerField(),
        'approved_shops': drf_serializers.IntegerField(),
        'pending_shops': drf_serializers.IntegerField(),
        'total_products': drf_serializers.IntegerField(),
        'top_queries': drf_serializers.ListField(child=drf_serializers.DictField()),
        'top_products': drf_serializers.ListField(child=drf_serializers.DictField()),
        'top_shops': drf_serializers.ListField(child=drf_serializers.DictField()),
    },
)

_shop_owner_serializer = inline_serializer(
    name='ShopOwnerAnalytics',
    fields={'shops': drf_serializers.ListField(child=drf_serializers.DictField())},
)

_track_serializer = inline_serializer(
    name='TrackResponse',
    fields={'message': drf_serializers.CharField()},
)


@extend_schema(responses={200: _admin_summary_serializer})
class AdminAnalyticsSummaryView(APIView):
    """Admin: full analytics dashboard summary."""

    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)

        top_queries = list(
            SearchLog.objects
            .filter(created_at__gte=week_ago)
            .values('query')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        top_products = list(
            ProductView.objects
            .filter(created_at__gte=week_ago)
            .values('product_id', 'product__name', 'product__category')
            .annotate(view_count=Count('id'))
            .order_by('-view_count')[:10]
        )
        top_shops = list(
            ShopView.objects
            .filter(created_at__gte=week_ago)
            .values('shop_id', 'shop__name', 'shop__city')
            .annotate(view_count=Count('id'))
            .order_by('-view_count')[:10]
        )

        # User role breakdown
        from apps.users.models import User
        user_roles = {
            'admin': User.objects.filter(role='ADMIN').count(),
            'shop_owner': User.objects.filter(role='SHOP_OWNER').count(),
            'normal_user': User.objects.filter(role='NORMAL_USER').count(),
        }

        # Recent activity
        recent_searches = SearchLog.objects.filter(created_at__gte=today).count()
        recent_product_views = ProductView.objects.filter(created_at__gte=today).count()
        recent_shop_views = ShopView.objects.filter(created_at__gte=today).count()

        return Response({
            'total_searches': SearchLog.objects.count(),
            'total_product_views': ProductView.objects.count(),
            'total_shop_views': ShopView.objects.count(),
            'searches_today': recent_searches,
            'searches_this_week': SearchLog.objects.filter(created_at__gte=week_ago).count(),
            'searches_this_month': SearchLog.objects.filter(created_at__gte=month_ago).count(),
            'new_users_today': User.objects.filter(date_joined__date=today).count(),
            'new_users_this_week': User.objects.filter(date_joined__gte=week_ago).count(),
            'new_users_this_month': User.objects.filter(date_joined__gte=month_ago).count(),
            'top_queries': top_queries,
            'top_products': top_products,
            'top_shops': top_shops,
            'total_users': User.objects.count(),
            'user_roles': user_roles,
            'total_shops': Shop.objects.count(),
            'approved_shops': Shop.objects.filter(is_approved=True).count(),
            'pending_shops': Shop.objects.filter(is_approved=False).count(),
            'active_shops': Shop.objects.filter(is_approved=True, is_active=True).count(),
            'total_products': Product.objects.filter(is_active=True).count(),
            'recent_activity': {
                'searches': recent_searches,
                'product_views': recent_product_views,
                'shop_views': recent_shop_views,
            },
        })


@extend_schema(responses={200: _shop_owner_serializer})
class ShopOwnerAnalyticsView(APIView):
    """Shop owner: analytics for their own shops."""

    permission_classes = [IsShopOwner]

    def get(self, request):
        shops = Shop.objects.filter(owner=request.user)
        today = timezone.now().date()
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)

        shop_stats = []
        for shop in shops:
            # Get shop products with their stats
            shop_products = shop.shop_products.all()
            total_products = shop_products.count()
            available_products = shop_products.filter(availability=True).count()
            
            # Price statistics
            prices = [sp.price for sp in shop_products if sp.price]
            avg_price = sum(prices) / len(prices) if prices else 0
            min_price = min(prices) if prices else 0
            max_price = max(prices) if prices else 0

            shop_stats.append({
                'shop_id': shop.id,
                'shop_name': shop.name,
                'is_approved': shop.is_approved,
                'is_active': shop.is_active,
                'rating': float(shop.rating),
                'review_count': shop.review_count,
                'total_views': ShopView.objects.filter(shop=shop).count(),
                'views_today': ShopView.objects.filter(shop=shop, created_at__date=today).count(),
                'views_this_week': ShopView.objects.filter(shop=shop, created_at__gte=week_ago).count(),
                'views_this_month': ShopView.objects.filter(shop=shop, created_at__gte=month_ago).count(),
                'product_views': ProductView.objects.filter(shop=shop).count(),
                'product_count': total_products,
                'available_products': available_products,
                'price_stats': {
                    'average': round(avg_price, 2),
                    'min': round(min_price, 2),
                    'max': round(max_price, 2),
                },
                'city': shop.city,
                'address': shop.address,
            })

        # Overall summary for the shop owner
        total_shops = shops.count()
        approved_shops = shops.filter(is_approved=True).count()
        total_inventory = sum(s['product_count'] for s in shop_stats)
        total_views = sum(s['total_views'] for s in shop_stats)

        return Response({
            'summary': {
                'total_shops': total_shops,
                'approved_shops': approved_shops,
                'pending_shops': total_shops - approved_shops,
                'total_inventory': total_inventory,
                'total_views': total_views,
            },
            'shops': shop_stats,
        })


class SearchLogListView(generics.ListAPIView):
    """Admin: list all search logs."""

    queryset = SearchLog.objects.all().order_by('-created_at')
    serializer_class = SearchLogSerializer
    permission_classes = [IsAdmin]


class ProductViewListView(generics.ListAPIView):
    """Admin: list all product views."""

    queryset = ProductView.objects.all().order_by('-created_at')
    serializer_class = ProductViewSerializer
    permission_classes = [IsAdmin]


@extend_schema(request=None, responses={201: _track_serializer})
class TrackShopViewView(APIView):
    """Track a shop page view."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, shop_id):
        try:
            shop = Shop.objects.get(pk=shop_id, is_approved=True, is_active=True)
        except Shop.DoesNotExist:
            return Response({'error': 'Shop not found.'}, status=status.HTTP_404_NOT_FOUND)

        ShopView.objects.create(
            shop=shop,
            user=request.user if request.user.is_authenticated else None,
        )
        return Response({'message': 'View tracked.'}, status=status.HTTP_201_CREATED)


_user_dashboard_serializer = inline_serializer(
    name='UserDashboardSerializer',
    fields={
        'user': drf_serializers.DictField(),
        'favorites_count': drf_serializers.IntegerField(),
        'recent_searches': drf_serializers.ListField(child=drf_serializers.DictField()),
        'recent_views': drf_serializers.ListField(child=drf_serializers.DictField()),
        'saved_shops': drf_serializers.ListField(child=drf_serializers.DictField()),
    },
)


@extend_schema(responses={200: _user_dashboard_serializer})
class UserDashboardView(APIView):
    """Normal user: personalized dashboard with their activity and favorites."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        week_ago = timezone.now() - timedelta(days=7)

        # User profile info
        user_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_verified': user.is_verified,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        }

        # Favorites count
        from apps.users.models import Favorite
        favorites_count = Favorite.objects.filter(user=user).count()

        # Recent searches
        recent_searches = list(
            SearchLog.objects
            .filter(user=user)
            .order_by('-created_at')[:10]
            .values('query', 'results_count', 'category_filter', 'city_filter', 'created_at')
        )

        # Recent product views
        recent_product_views = list(
            ProductView.objects
            .filter(user=user)
            .select_related('product', 'shop')
            .order_by('-created_at')[:10]
            .values(
                'product__name',
                'product__category',
                'product__image',
                'shop__name',
                'shop__city',
                'created_at',
            )
        )

        # Recent shop views
        recent_shop_views = list(
            ShopView.objects
            .filter(user=user)
            .select_related('shop')
            .order_by('-created_at')[:10]
            .values(
                'shop__name',
                'shop__city',
                'shop__rating',
                'shop__address',
                'created_at',
            )
        )

        # Combine views
        recent_views = []
        for pv in recent_product_views:
            recent_views.append({
                'type': 'product',
                'name': pv['product__name'],
                'category': pv['product__category'],
                'image': pv['product__image'],
                'shop': pv['shop__name'],
                'city': pv['shop__city'],
                'created_at': pv['created_at'],
            })
        for sv in recent_shop_views:
            recent_views.append({
                'type': 'shop',
                'name': sv['shop__name'],
                'city': sv['shop__city'],
                'rating': float(sv['shop__rating']),
                'address': sv['shop__address'],
                'created_at': sv['created_at'],
            })

        # Sort by created_at and limit
        recent_views = sorted(recent_views, key=lambda x: x['created_at'], reverse=True)[:10]

        # Saved shops (if user is a shop owner)
        saved_shops = []
        if user.role == 'SHOP_OWNER':
            shops = Shop.objects.filter(owner=user)
            for shop in shops:
                saved_shops.append({
                    'id': shop.id,
                    'name': shop.name,
                    'city': shop.city,
                    'is_approved': shop.is_approved,
                    'rating': float(shop.rating),
                    'product_count': shop.shop_products.filter(availability=True).count(),
                })

        return Response({
            'user': user_info,
            'favorites_count': favorites_count,
            'recent_searches': recent_searches,
            'recent_views': recent_views,
            'saved_shops': saved_shops,
        })
