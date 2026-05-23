"""
Views for user management: registration, login, profile CRUD.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers

from .models import User
from apps.products.models import Product
from apps.users.models import Favorite, PriceAlert
from django.core.cache import cache
from django.utils.crypto import get_random_string
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    FavoriteSerializer,
    FavoriteCreateSerializer,
    PriceAlertSerializer,
    PriceAlertCreateSerializer,
    PriceAlertUpdateSerializer,
)
from .permissions import IsAdmin, IsOwnerOrAdmin

_token_serializer = inline_serializer(
    name='TokenPair',
    fields={
        'refresh': drf_serializers.CharField(),
        'access': drf_serializers.CharField(),
    },
)
_auth_response = inline_serializer(
    name='AuthResponse',
    fields={
        'message': drf_serializers.CharField(),
        'user': UserProfileSerializer(),
        'tokens': _token_serializer,
    },
)
_message_serializer = inline_serializer(
    name='UserMessageResponse',
    fields={'message': drf_serializers.CharField()},
)


from rest_framework.throttling import AnonRateThrottle
from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class RegisterRateThrottle(SimpleRateThrottle):
    scope = 'register'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class PasswordResetRateThrottle(SimpleRateThrottle):
    scope = 'password_reset'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request),
        }


class RegisterView(generics.CreateAPIView):
    """Register a new user account."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Registration successful.',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(request=UserLoginSerializer, responses={200: _auth_response})
class LoginView(APIView):
    """Authenticate user and return JWT tokens."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = serializer.get_tokens(user)
        return Response(
            {
                'message': 'Login successful.',
                'user': UserProfileSerializer(user).data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    request=inline_serializer(
        name='LogoutRequest',
        fields={'refresh': drf_serializers.CharField()},
    ),
    responses={200: _message_serializer},
)
class LogoutView(APIView):
    """Blacklist the refresh token to log out."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(
    request=inline_serializer(
        name='TokenRefreshRequest',
        fields={'refresh': drf_serializers.CharField()},
    ),
    responses={200: _token_serializer},
)
class TokenRefreshView(APIView):
    """Refresh access token using refresh token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)
            
            return Response({
                'access': access_token,
                'refresh': str(token),  # Return new refresh token if rotation is enabled
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': 'Invalid or expired refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


@extend_schema(operation_id='users_my_profile_retrieve', methods=['GET'])
@extend_schema(operation_id='users_my_profile_update', methods=['PUT', 'PATCH'])
class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update the authenticated user's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(
    request=ChangePasswordSerializer,
    responses={200: _message_serializer},
)
class ChangePasswordView(APIView):
    """Change the authenticated user's password."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


@extend_schema(
    request=inline_serializer(
        name='PasswordResetRequest',
        fields={'email': drf_serializers.EmailField()},
    ),
    responses={200: _message_serializer},
)
class PasswordResetRequestView(APIView):
    """Request a password reset token sent to email (stored in cache for 15 min)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        token = get_random_string(64)
        cache.set(f'pwd_reset_{token}', user.pk, timeout=900)  # 15 minutes
        # In production, send this token via email. For now return it directly.
        return Response({
            'message': 'Password reset token generated.',
            'token': token,  # Remove this in production; send via email instead
        })


@extend_schema(
    request=inline_serializer(
        name='PasswordResetConfirm',
        fields={
            'token': drf_serializers.CharField(),
            'new_password': drf_serializers.CharField(),
            'new_password_confirm': drf_serializers.CharField(),
        },
    ),
    responses={200: _message_serializer},
)
class PasswordResetConfirmView(APIView):
    """Confirm password reset using the token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        user_pk = cache.get(f'pwd_reset_{token}')
        if not user_pk:
            return Response(
                {'error': 'Invalid or expired reset token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        cache.delete(f'pwd_reset_{token}')
        return Response({'message': 'Password reset successfully.'})


class UserListView(generics.ListAPIView):
    """List all users - admin only."""

    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['created_at', 'username', 'role']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific user - admin only."""

    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save()
        return Response({'message': 'User deactivated successfully.'}, status=status.HTTP_200_OK)


@extend_schema(operation_id='users_public_profile_retrieve')
class PublicUserProfileView(generics.RetrieveAPIView):
    """Get a public user profile by ID."""

    queryset = User.objects.filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]


class FavoriteListView(generics.ListCreateAPIView):
    """List and create favorites for the authenticated user."""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FavoriteCreateSerializer
        return FavoriteSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDetailView(generics.RetrieveDestroyAPIView):
    """Retrieve or delete a specific favorite."""

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class FavoriteToggleView(APIView):
    """Add or remove a product from favourites. DELETE removes, POST adds."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        _, created = Favorite.objects.get_or_create(user=request.user, product=product)
        return Response(
            {'message': 'Added to favourites.' if created else 'Already in favourites.'},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, product_id):
        deleted, _ = Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response({'message': 'Removed from favourites.'})
        return Response({'error': 'Not in favourites.'}, status=status.HTTP_404_NOT_FOUND)


class PriceAlertListView(generics.ListCreateAPIView):
    """List and create price alerts for the authenticated user."""

    serializer_class = PriceAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active', 'is_triggered']
    ordering_fields = ['created_at', 'target_price']
    ordering = ['-created_at']

    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user).select_related('product')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PriceAlertCreateSerializer
        return PriceAlertSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PriceAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific price alert."""

    serializer_class = PriceAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PriceAlertUpdateSerializer
        return PriceAlertSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        alert = self.get_object()
        alert.is_active = False
        alert.save()
        return Response({'message': 'Price alert deactivated.'}, status=status.HTTP_200_OK)
