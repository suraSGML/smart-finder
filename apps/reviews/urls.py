"""URL patterns for the reviews app."""
from django.urls import path
from . import views

app_name = 'reviews'

urlpatterns = [
    path('', views.ReviewListView.as_view(), name='review-list'),
    path('create/', views.ReviewCreateView.as_view(), name='review-create'),
    path('my/', views.MyReviewsView.as_view(), name='my-reviews'),
    path('shop/<int:shop_id>/', views.ShopReviewListView.as_view(), name='shop-reviews'),
    path('<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    path('<int:pk>/helpful/', views.MarkReviewHelpfulView.as_view(), name='review-helpful'),
]
