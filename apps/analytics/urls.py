"""URL patterns for the analytics app."""
from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('admin/summary/', views.AdminAnalyticsSummaryView.as_view(), name='admin-summary'),
    path('shop-owner/', views.ShopOwnerAnalyticsView.as_view(), name='shop-owner-analytics'),
    path('user/', views.UserDashboardView.as_view(), name='user-dashboard'),
    path('search-logs/', views.SearchLogListView.as_view(), name='search-logs'),
    path('product-views/', views.ProductViewListView.as_view(), name='product-views'),
    path('track/shop/<int:shop_id>/', views.TrackShopViewView.as_view(), name='track-shop-view'),
]
