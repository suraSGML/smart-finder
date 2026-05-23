"""
Views for the reviews and rating system.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers as drf_serializers

from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewUpdateSerializer
from apps.users.permissions import IsOwnerOrAdmin

_helpful_serializer = inline_serializer(
    name='HelpfulResponse',
    fields={
        'message': drf_serializers.CharField(),
        'helpful_count': drf_serializers.IntegerField(),
    },
)


class ShopReviewListView(generics.ListAPIView):
    """List all reviews for a specific shop."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating', 'helpful_count']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        shop_id = self.kwargs['shop_id']
        return Review.objects.filter(shop_id=shop_id).select_related('user', 'shop')


class ReviewCreateView(generics.CreateAPIView):
    """Create a new review for a shop."""

    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save()
        return Response(
            ReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a review."""

    queryset = Review.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ReviewUpdateSerializer
        return ReviewSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        self.check_object_permissions(request, review)
        review.delete()
        return Response({'message': 'Review deleted.'}, status=status.HTTP_200_OK)


class MyReviewsView(generics.ListAPIView):
    """List all reviews written by the authenticated user."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        return Review.objects.filter(user=self.request.user).select_related('shop')


@extend_schema(request=None, responses={200: _helpful_serializer})
class MarkReviewHelpfulView(APIView):
    """Mark a review as helpful."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

        if review.user == request.user:
            return Response(
                {'error': 'You cannot mark your own review as helpful.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'message': 'Marked as helpful.', 'helpful_count': review.helpful_count})


class ReviewListView(generics.ListAPIView):
    """List all reviews with optional filtering by shop or product."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['shop', 'rating']
    ordering_fields = ['created_at', 'rating', 'helpful_count']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Review.objects.none()
        queryset = Review.objects.all().select_related('user', 'shop')
        shop_id = self.request.query_params.get('shop')
        product_id = self.request.query_params.get('product')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        if product_id:
            # Filter reviews for products sold at shops (via shop products)
            from apps.products.models import ShopProduct
            shop_ids = ShopProduct.objects.filter(product_id=product_id).values_list('shop_id', flat=True)
            queryset = queryset.filter(shop_id__in=shop_ids)
        return queryset
