"""
Views for shop management: CRUD, approval, nearby shops.
"""
from django.db.models import Q
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers as drf_serializers

from .models import Shop
from .serializers import (
    ShopSerializer,
    ShopCreateSerializer,
    ShopListSerializer,
    ShopApprovalSerializer,
)
from apps.users.permissions import IsShopOwner, IsAdmin, IsOwnerOrAdmin

_nearby_serializer = inline_serializer(
    name='NearbyShopsResponse',
    fields={
        'count': drf_serializers.IntegerField(),
        'radius_km': drf_serializers.FloatField(),
        'results': ShopListSerializer(many=True),
    },
)

_approve_serializer = inline_serializer(
    name='ApproveShopResponse',
    fields={
        'message': drf_serializers.CharField(),
        'shop': ShopSerializer(),
    },
)


class ShopListView(generics.ListAPIView):
    """List all approved and active shops."""

    serializer_class = ShopListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'sub_city', 'is_approved', 'is_active']
    search_fields = ['name', 'description', 'address', 'city']
    ordering_fields = ['rating', 'created_at', 'name']

    def get_queryset(self):
        queryset = Shop.objects.filter(is_approved=True, is_active=True)
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        return queryset


class ShopCreateView(generics.CreateAPIView):
    """Create a new shop - shop owners only."""

    serializer_class = ShopCreateSerializer
    permission_classes = [IsShopOwner]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shop = serializer.save()
        return Response(
            {
                'message': 'Shop created successfully. Awaiting admin approval.',
                'shop': ShopSerializer(shop, context={'request': request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ShopDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a shop."""

    queryset = Shop.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ShopCreateSerializer
        return ShopSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(self, 'swagger_fake_view', False):
            return Shop.objects.none()
        if user.is_authenticated and (user.role == 'ADMIN' or user.is_staff):
            return Shop.objects.all()
        if user.is_authenticated and user.role == 'SHOP_OWNER':
            return Shop.objects.filter(Q(is_approved=True, is_active=True) | Q(owner=user))
        return Shop.objects.filter(is_approved=True, is_active=True)

    def retrieve(self, request, *args, **kwargs):
        # Simplified retrieve method - let queryset filtering handle permissions
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': f'Shop not found or not accessible: {str(e)}'}, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        shop = self.get_object()
        shop.is_active = False
        shop.save()
        return Response({'message': 'Shop deactivated successfully.'}, status=status.HTTP_200_OK)


class MyShopsView(generics.ListAPIView):
    """List shops owned by the authenticated shop owner."""

    serializer_class = ShopSerializer
    permission_classes = [IsShopOwner]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Shop.objects.none()
        return Shop.objects.filter(owner=self.request.user)


@extend_schema(
    parameters=[
        OpenApiParameter('lat', float, description='User latitude'),
        OpenApiParameter('lon', float, description='User longitude'),
        OpenApiParameter('radius', float, description='Search radius in km (default 5)'),
    ],
    responses={200: _nearby_serializer},
)
class NearbyShopsView(APIView):
    """Find shops within a given radius of a location."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            user_lat = float(request.query_params.get('lat', 0))
            user_lon = float(request.query_params.get('lon', 0))
            radius_km = float(request.query_params.get('radius', 5))
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid lat, lon, or radius parameters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (user_lat and user_lon):
            return Response(
                {'error': 'lat and lon parameters are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shops = Shop.objects.filter(
            is_approved=True,
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False,
        )

        nearby = []
        for shop in shops:
            distance = shop.calculate_distance(user_lat, user_lon)
            if distance is not None and distance <= radius_km:
                shop._distance = distance
                nearby.append(shop)

        nearby.sort(key=lambda s: s._distance)

        serializer = ShopListSerializer(nearby, many=True, context={'request': request})
        return Response({'count': len(nearby), 'radius_km': radius_km, 'results': serializer.data})


class AdminShopListView(generics.ListAPIView):
    """Admin: list all shops including unapproved."""

    queryset = Shop.objects.all().order_by('-created_at')
    serializer_class = ShopSerializer
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['city', 'is_approved', 'is_active']
    search_fields = ['name', 'owner__username', 'owner__email']
    ordering_fields = ['created_at', 'rating', 'name']


@extend_schema(request=ShopApprovalSerializer, responses={200: _approve_serializer})
class ApproveShopView(APIView):
    """Admin: approve or reject a shop."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            shop = Shop.objects.get(pk=pk)
        except Shop.DoesNotExist:
            return Response({'error': 'Shop not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopApprovalSerializer(shop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        action = 'approved' if shop.is_approved else 'rejected'
        return Response(
            {
                'message': f'Shop {action} successfully.',
                'shop': ShopSerializer(shop, context={'request': request}).data,
            }
        )


@extend_schema(
    parameters=[
        OpenApiParameter('lat', float, description='Center latitude'),
        OpenApiParameter('lon', float, description='Center longitude'),
        OpenApiParameter('zoom', int, description='Map zoom level (default 12)'),
        OpenApiParameter('city', str, description='Filter by city'),
    ],
    responses={200: inline_serializer(
        name='ClusterResponse',
        fields={'clusters': drf_serializers.ListField(child=drf_serializers.DictField())},
    )},
)
class ShopClusterView(APIView):
    """Return clustered shops for map visualization."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            center_lat = float(request.query_params.get('lat', 9.02))  # Default Addis Ababa
            center_lon = float(request.query_params.get('lon', 38.75))
            zoom = int(request.query_params.get('zoom', 12))
        except (TypeError, ValueError):
            center_lat = 9.02
            center_lon = 38.75
            zoom = 12

        city = request.query_params.get('city', None)

        # Calculate cluster radius based on zoom level
        # Higher zoom = smaller clusters
        cluster_radius_km = max(0.5, 50 / (2 ** (zoom - 10)))

        shops = Shop.objects.filter(
            is_approved=True,
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False,
        )

        if city:
            shops = shops.filter(city__icontains=city)

        # Simple clustering algorithm
        clusters = []
        used_shops = set()

        for shop in shops:
            if shop.id in used_shops:
                continue

            # Find nearby shops
            nearby_shops = [shop]
            for other_shop in shops:
                if other_shop.id == shop.id or other_shop.id in used_shops:
                    continue
                
                distance = shop.calculate_distance(
                    float(other_shop.latitude),
                    float(other_shop.longitude)
                )
                
                if distance and distance <= cluster_radius_km:
                    nearby_shops.append(other_shop)

            # Create cluster
            if len(nearby_shops) == 1:
                # Single shop - return as individual marker
                clusters.append({
                    'type': 'marker',
                    'shop_id': shop.id,
                    'name': shop.name,
                    'latitude': float(shop.latitude),
                    'longitude': float(shop.longitude),
                    'count': 1,
                    'rating': float(shop.rating),
                })
            else:
                # Multiple shops - create cluster
                avg_lat = sum(float(s.latitude) for s in nearby_shops) / len(nearby_shops)
                avg_lon = sum(float(s.longitude) for s in nearby_shops) / len(nearby_shops)
                avg_rating = sum(float(s.rating) for s in nearby_shops) / len(nearby_shops)
                
                clusters.append({
                    'type': 'cluster',
                    'latitude': avg_lat,
                    'longitude': avg_lon,
                    'count': len(nearby_shops),
                    'rating': round(avg_rating, 2),
                    'shop_ids': [s.id for s in nearby_shops],
                })

            # Mark shops as used
            for s in nearby_shops:
                used_shops.add(s.id)

        return Response({'clusters': clusters})
