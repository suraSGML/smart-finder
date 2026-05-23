"""URL patterns for the shopping app."""
from django.urls import path
from . import views

app_name = 'shopping'

urlpatterns = [
    # Shopping Lists
    path('', views.ShoppingListListView.as_view(), name='shopping-list-list'),
    path('summary/', views.ShoppingListSummaryView.as_view(), name='shopping-list-summary'),
    path('<int:pk>/', views.ShoppingListDetailView.as_view(), name='shopping-list-detail'),
    
    # Shopping List Items
    path('<int:shopping_list_id>/items/', views.ShoppingListItemListView.as_view(), name='shopping-list-item-list'),
    path('items/<int:pk>/', views.ShoppingListItemDetailView.as_view(), name='shopping-list-item-detail'),
    path('items/<int:item_id>/toggle/', views.ToggleItemCompletionView.as_view(), name='toggle-item-completion'),
    
    # Quick Actions
    path('<int:shopping_list_id>/add-product/', views.AddProductToListView.as_view(), name='add-product-to-list'),
]
