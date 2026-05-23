"""
Views for shopping list and cart management.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import ShoppingList, ShoppingListItem
from .serializers import (
    ShoppingListSerializer,
    ShoppingListCreateSerializer,
    ShoppingListUpdateSerializer,
    ShoppingListItemSerializer,
    ShoppingListItemCreateSerializer,
)


class ShoppingListListView(generics.ListCreateAPIView):
    """List and create shopping lists for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active']
    ordering_fields = ['created_at', 'name', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ShoppingListCreateSerializer
        return ShoppingListSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ShoppingListDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a shopping list."""

    serializer_class = ShoppingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ShoppingList.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ShoppingListUpdateSerializer
        return ShoppingListSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        shopping_list = self.get_object()
        shopping_list.is_active = False
        shopping_list.save()
        return Response({'message': 'Shopping list deactivated.'}, status=status.HTTP_200_OK)


class ShoppingListItemListView(generics.ListCreateAPIView):
    """List and create items in a shopping list."""

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_completed']
    ordering_fields = ['created_at', 'quantity']
    ordering = ['-created_at']

    def get_queryset(self):
        shopping_list_id = self.kwargs['shopping_list_id']
        return ShoppingListItem.objects.filter(
            shopping_list_id=shopping_list_id,
            shopping_list__user=self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ShoppingListItemCreateSerializer
        return ShoppingListItemSerializer

    def perform_create(self, serializer):
        shopping_list_id = self.kwargs['shopping_list_id']
        shopping_list = ShoppingList.objects.get(
            id=shopping_list_id,
            user=self.request.user,
        )
        serializer.save(shopping_list=shopping_list)


class ShoppingListItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a shopping list item."""

    serializer_class = ShoppingListItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ShoppingListItem.objects.filter(
            shopping_list__user=self.request.user,
        )

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ShoppingListItemCreateSerializer
        return ShoppingListItemSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ToggleItemCompletionView(APIView):
    """Toggle the completion status of a shopping list item."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, item_id):
        try:
            item = ShoppingListItem.objects.get(
                id=item_id,
                shopping_list__user=request.user,
            )
            item.is_completed = not item.is_completed
            item.save()
            serializer = ShoppingListItemSerializer(item)
            return Response(serializer.data)
        except ShoppingListItem.DoesNotExist:
            return Response(
                {'error': 'Shopping list item not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class AddProductToListView(APIView):
    """Quick add a product to a shopping list."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shopping_list_id):
        try:
            shopping_list = ShoppingList.objects.get(
                id=shopping_list_id,
                user=request.user,
            )
        except ShoppingList.DoesNotExist:
            return Response(
                {'error': 'Shopping list not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        product_id = request.data.get('product_id')
        shop_product_id = request.data.get('shop_product_id')
        quantity = request.data.get('quantity', 1)

        if not product_id and not shop_product_id:
            return Response(
                {'error': 'Either product_id or shop_product_id must be provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.products.models import Product, ShopProduct

        try:
            if shop_product_id:
                shop_product = ShopProduct.objects.get(id=shop_product_id)
                product = shop_product.product
            else:
                product = Product.objects.get(id=product_id)
                shop_product = None

            # Check if item already exists
            existing_item = ShoppingListItem.objects.filter(
                shopping_list=shopping_list,
                product=product,
            ).first()

            if existing_item:
                existing_item.quantity += quantity
                if shop_product:
                    existing_item.shop_product = shop_product
                existing_item.save()
                serializer = ShoppingListItemSerializer(existing_item)
                return Response(serializer.data)
            else:
                item = ShoppingListItem.objects.create(
                    shopping_list=shopping_list,
                    product=product,
                    shop_product=shop_product,
                    quantity=quantity,
                )
                serializer = ShoppingListItemSerializer(item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except (Product.DoesNotExist, ShopProduct.DoesNotExist):
            return Response(
                {'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class ShoppingListSummaryView(APIView):
    """Get a summary of all shopping lists for the user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        shopping_lists = ShoppingList.objects.filter(user=request.user, is_active=True)
        
        summary = {
            'total_lists': shopping_lists.count(),
            'total_items': 0,
            'total_estimated_cost': 0,
            'completed_items': 0,
            'lists': [],
        }

        for shopping_list in shopping_lists:
            list_data = {
                'id': shopping_list.id,
                'name': shopping_list.name,
                'total_items': shopping_list.get_total_items(),
                'completed_items': shopping_list.get_completed_items(),
                'estimated_cost': shopping_list.get_total_estimated_cost(),
                'created_at': shopping_list.created_at,
            }
            summary['lists'].append(list_data)
            summary['total_items'] += list_data['total_items']
            summary['completed_items'] += list_data['completed_items']
            summary['total_estimated_cost'] += list_data['estimated_cost']

        return Response(summary)
