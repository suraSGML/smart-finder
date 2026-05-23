"""
Signals for the products app.
- Records price history on ShopProduct save.
- Fires PRICE_DROP and BACK_IN_STOCK notifications to users who favorited the product.
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver


@receiver(pre_save, sender='products.ShopProduct')
def track_price_and_stock_changes(sender, instance, **kwargs):
    if not instance.pk:
        return  # New record, nothing to compare

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    from apps.products.models import PriceHistory
    from apps.notifications.models import Notification
    from apps.users.models import User

    price_dropped = instance.price < old.price
    came_back_in_stock = instance.availability and not old.availability

    # Always record price change
    if old.price != instance.price:
        PriceHistory.objects.create(
            shop_product=instance,
            old_price=old.price,
            new_price=instance.price,
        )

    # Find users who favorited this product
    if price_dropped or came_back_in_stock:
        try:
            from apps.users.models import Favorite
            favorited_users = User.objects.filter(
                favorites__product=instance.product
            ).distinct()
        except Exception:
            favorited_users = User.objects.none()

        if price_dropped and favorited_users.exists():
            diff = float(old.price) - float(instance.price)
            Notification.send_bulk(
                users=favorited_users,
                title=f'Price Drop: {instance.product.name}',
                message=(
                    f'{instance.product.name} at {instance.shop.name} dropped from '
                    f'ETB {old.price:,.0f} to ETB {instance.price:,.0f} '
                    f'(save ETB {diff:,.0f})!'
                ),
                notification_type='PRICE_DROP',
            )

        if came_back_in_stock and favorited_users.exists():
            Notification.send_bulk(
                users=favorited_users,
                title=f'Back in Stock: {instance.product.name}',
                message=(
                    f'{instance.product.name} is back in stock at '
                    f'{instance.shop.name} for ETB {instance.price:,.0f}.'
                ),
                notification_type='BACK_IN_STOCK',
            )
