"""URL patterns for the search app."""
from django.urls import path
from . import views

app_name = 'search'

urlpatterns = [
    path('', views.SearchView.as_view(), name='search'),
    path('suggestions/', views.SuggestionsView.as_view(), name='suggestions'),
    path('trending/', views.TrendingView.as_view(), name='trending'),
]
