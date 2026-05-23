"""URL patterns for the notifications app."""
from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
    path('mark-all-read/', views.MarkAllReadView.as_view(), name='mark-all-read'),
    path('admin/send/', views.AdminSendNotificationView.as_view(), name='admin-send'),
    path('<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='mark-read'),
]
