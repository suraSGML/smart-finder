"""
Views for the notification system.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers as drf_serializers

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from apps.users.permissions import IsAdmin

_message_serializer = inline_serializer(
    name='MessageResponse',
    fields={'message': drf_serializers.CharField()},
)
_unread_serializer = inline_serializer(
    name='UnreadCountResponse',
    fields={'unread_count': drf_serializers.IntegerField()},
)


class NotificationListView(generics.ListAPIView):
    """List all notifications for the authenticated user."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        queryset = Notification.objects.filter(user=self.request.user)
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        return queryset


class NotificationDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a specific notification."""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user)


@extend_schema(request=None, responses={200: _message_serializer})
class MarkNotificationReadView(APIView):
    """Mark a notification as read."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'message': 'Notification marked as read.'})


@extend_schema(request=None, responses={200: _message_serializer})
class MarkAllReadView(APIView):
    """Mark all notifications as read for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'message': f'{count} notification(s) marked as read.'})


@extend_schema(responses={200: _unread_serializer})
class UnreadCountView(APIView):
    """Return the count of unread notifications."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class AdminSendNotificationView(generics.CreateAPIView):
    """Admin: send a notification to a specific user."""

    serializer_class = NotificationCreateSerializer
    permission_classes = [IsAdmin]
