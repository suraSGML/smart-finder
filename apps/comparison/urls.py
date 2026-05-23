"""URL patterns for the comparison app."""
from django.urls import path
from . import views

app_name = 'comparison'

urlpatterns = [
    path('product/<int:product_id>/', views.CompareProductView.as_view(), name='compare-product'),
    path('product/<int:product_id>/export/pdf/', views.ExportComparisonPDFView.as_view(), name='export-pdf'),
    path('products/', views.CompareMultipleProductsView.as_view(), name='compare-multiple'),
]
