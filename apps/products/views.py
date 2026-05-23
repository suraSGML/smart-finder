"""
Views for product and shop-product management.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Product, ShopProduct
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    ShopProductSerializer,
    ShopProductCreateSerializer,
    ProductWithShopsSerializer,
)
from apps.users.permissions import IsAdmin, IsShopOwner, IsShopOwnerOrAdmin


class ProductListView(generics.ListAPIView):
    """List all active products."""

    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description', 'brand', 'tags']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True)


class ProductCreateView(generics.CreateAPIView):
    """Create a new product - admin or shop owner."""

    serializer_class = ProductSerializer
    permission_classes = [IsShopOwnerOrAdmin]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a product."""

    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductWithShopsSerializer
        return ProductSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response({'message': 'Product deactivated.'}, status=status.HTTP_200_OK)


class ProductsByCategoryView(generics.ListAPIView):
    """List products filtered by category."""

    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        category = self.kwargs.get('category', '').upper()
        return Product.objects.filter(category=category, is_active=True)


# --- ShopProduct Views ---

class ShopProductListView(generics.ListAPIView):
    """List all shop-product entries."""

    serializer_class = ShopProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['shop', 'product', 'availability']
    ordering_fields = ['price', 'updated_at']

    def get_queryset(self):
        return ShopProduct.objects.filter(
            availability=True,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('shop', 'product')


class ShopProductCreateView(generics.CreateAPIView):
    """Add a product to a shop."""

    serializer_class = ShopProductCreateSerializer
    permission_classes = [IsShopOwnerOrAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shop_product = serializer.save()
        return Response(
            ShopProductSerializer(shop_product, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ShopProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a shop-product entry."""

    queryset = ShopProduct.objects.all()
    permission_classes = [IsShopOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ShopProductCreateSerializer
        return ShopProductSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ShopInventoryView(generics.ListAPIView):
    """List all products in a specific shop."""

    serializer_class = ShopProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['availability']
    ordering_fields = ['price', 'updated_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ShopProduct.objects.none()
        shop_id = self.kwargs['shop_id']
        return ShopProduct.objects.filter(
            shop_id=shop_id,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('product')


class MyShopInventoryView(generics.ListCreateAPIView):
    """Shop owner: manage their own shop's inventory."""

    permission_classes = [IsShopOwner]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ShopProductCreateSerializer
        return ShopProductSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ShopProduct.objects.none()
        return ShopProduct.objects.filter(
            shop__owner=self.request.user,
        ).select_related('shop', 'product')


class PriceHistoryView(APIView):
    """Get price history for a specific shop-product."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, shop_product_id):
        from .models import PriceHistory
        from .serializers import PriceHistorySerializer
        
        try:
            shop_product = ShopProduct.objects.get(pk=shop_product_id)
        except ShopProduct.DoesNotExist:
            return Response(
                {'error': 'Shop product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        price_history = PriceHistory.objects.filter(
            shop_product=shop_product
        ).order_by('-changed_at')
        
        serializer = PriceHistorySerializer(price_history, many=True)
        return Response({
            'shop_product_id': shop_product_id,
            'current_price': float(shop_product.price),
            'price_history': serializer.data
        })


class BarcodeLookupView(APIView):
    """Look up a product by its barcode."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, barcode):
        try:
            product = Product.objects.get(barcode=barcode, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found with this barcode.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProductWithShopsSerializer(product, context={'request': request})
        return Response(serializer.data)
