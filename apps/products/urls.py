"""URL patterns for the products app."""
from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Products
    path('', views.ProductListView.as_view(), name='product-list'),
    path('create/', views.ProductCreateView.as_view(), name='product-create'),
    path('category/<str:category>/', views.ProductsByCategoryView.as_view(), name='products-by-category'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('barcode/<str:barcode>/', views.BarcodeLookupView.as_view(), name='barcode-lookup'),

    # Shop Products
    path('shop-products/', views.ShopProductListView.as_view(), name='shop-product-list'),
    path('shop-products/create/', views.ShopProductCreateView.as_view(), name='shop-product-create'),
    path('shop-products/my-inventory/', views.MyShopInventoryView.as_view(), name='my-inventory'),
    path('shop-products/<int:pk>/', views.ShopProductDetailView.as_view(), name='shop-product-detail'),
    path('shop/<int:shop_id>/inventory/', views.ShopInventoryView.as_view(), name='shop-inventory'),

    # Price History
    path('shop-products/<int:shop_product_id>/price-history/', views.PriceHistoryView.as_view(), name='price-history'),
]
