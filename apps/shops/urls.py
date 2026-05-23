"""URL patterns for the shops app."""
from django.urls import path
from . import views

app_name = 'shops'

urlpatterns = [
    path('', views.ShopListView.as_view(), name='shop-list'),
    path('create/', views.ShopCreateView.as_view(), name='shop-create'),
    path('my-shops/', views.MyShopsView.as_view(), name='my-shops'),
    path('nearby/', views.NearbyShopsView.as_view(), name='nearby-shops'),
    path('clusters/', views.ShopClusterView.as_view(), name='shop-clusters'),
    path('admin/all/', views.AdminShopListView.as_view(), name='admin-shop-list'),
    path('admin/<int:pk>/approve/', views.ApproveShopView.as_view(), name='approve-shop'),
    path('<int:pk>/', views.ShopDetailView.as_view(), name='shop-detail'),
]
