"""URL patterns for the users app."""
from django.urls import path

from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),

    # Password reset
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('profile/<int:pk>/', views.PublicUserProfileView.as_view(), name='public-profile'),

    # Admin
    path('', views.UserListView.as_view(), name='user-list'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),

    # Favourites
    path('favorites/', views.FavoriteListView.as_view(), name='favorites-list'),
    path('favorites/<int:pk>/', views.FavoriteDetailView.as_view(), name='favorites-detail'),
    path('favorites/toggle/', views.FavoriteToggleView.as_view(), name='favorites-toggle'),
    path('favorites/<int:product_id>/', views.FavoriteToggleView.as_view(), name='favorites-remove'),

    # Price Alerts
    path('price-alerts/', views.PriceAlertListView.as_view(), name='price-alerts-list'),
    path('price-alerts/<int:pk>/', views.PriceAlertDetailView.as_view(), name='price-alerts-detail'),
]
