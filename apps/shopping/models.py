"""
Shopping List and Cart models for Smart Local Product Finder.
"""
from django.db import models
from django.core.validators import MinValueValidator
from apps.users.models import User
from apps.products.models import Product, ShopProduct


class ShoppingList(models.Model):
    """A shopping list created by a user."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shopping_lists',
    )
    name = models.CharField(max_length=200, default='My Shopping List')
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Shopping List'
        verbose_name_plural = 'Shopping Lists'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.user.username} - {self.name}'

    def get_total_items(self):
        """Return total number of items in the list."""
        return self.items.count()

    def get_total_estimated_cost(self):
        """Return estimated total cost based on minimum prices."""
        total = 0
        for item in self.items.all():
            if item.product:
                min_price = item.product.get_min_price()
                if min_price:
                    total += min_price * item.quantity
        return total

    def get_completed_items(self):
        """Return number of completed items."""
        return self.items.filter(is_completed=True).count()


class ShoppingListItem(models.Model):
    """An item in a shopping list."""

    shopping_list = models.ForeignKey(
        ShoppingList,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='shopping_list_items',
        null=True,
        blank=True,
    )
    shop_product = models.ForeignKey(
        ShopProduct,
        on_delete=models.SET_NULL,
        related_name='shopping_list_items',
        null=True,
        blank=True,
        help_text='Specific shop product if user wants to buy from a particular shop',
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    notes = models.CharField(max_length=300, blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Shopping List Item'
        verbose_name_plural = 'Shopping List Items'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shopping_list', 'is_completed']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        product_name = self.product.name if self.product else 'Unknown Product'
        return f'{self.shopping_list.name} - {product_name} (x{self.quantity})'

    def get_estimated_price(self):
        """Return estimated price for this item."""
        if self.shop_product:
            return float(self.shop_product.price) * self.quantity
        elif self.product:
            min_price = self.product.get_min_price()
            if min_price:
                return float(min_price) * self.quantity
        return 0
