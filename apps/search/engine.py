"""
Smart Search Engine for Local Product Finder.
Implements prefix matching, category-based related products, and search logging.
"""
import logging
from django.db.models import Q, Count
from django.core.cache import cache

from apps.products.models import Product, ShopProduct
from apps.shops.models import Shop

logger = logging.getLogger(__name__)


class SmartSearchEngine:
    """
    Intelligent search engine combining text search with location awareness.
    Supports prefix matching, category-based suggestions, and search logging.
    """

    CACHE_TIMEOUT = 300  # 5 minutes
    MAX_SUGGESTIONS = 10
    MAX_RESULTS = 50

    def search(self, query, user_lat=None, user_lon=None, category=None, city=None, price_min=None, price_max=None, min_rating=None, max_distance=None, sort_by='relevance'):
        """
        Search for products and shops matching the query.
        Supports text search, category-only browse, location-aware sorting, and price/rating/distance filters.
        """
        query = (query or '').strip()
        has_query = len(query) >= 2
        has_category = bool(category)

        # Need at least a query or a category
        if not has_query and not has_category:
            return self._empty_result('')

        # Don't cache when filters are applied to ensure fresh results
        cache_key = f'search:{query}:{category}:{city}:{price_min}:{price_max}:{min_rating}:{max_distance}:{sort_by}'
        try:
            cached = cache.get(cache_key)
            if cached and not any([price_min, price_max, min_rating, max_distance, sort_by != 'relevance']):
                return cached
        except Exception:
            pass

        # Build product queryset
        product_qs = Product.objects.filter(is_active=True)

        if has_category:
            product_qs = product_qs.filter(category=category.upper())

        if has_query:
            product_qs = product_qs.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(brand__icontains=query)
                | Q(tags__icontains=query)
            ).distinct()

        # Build shop-product queryset
        shop_product_qs = ShopProduct.objects.filter(
            product__in=product_qs,
            availability=True,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('product', 'shop')

        # Apply price filters
        if price_min:
            shop_product_qs = shop_product_qs.filter(price__gte=float(price_min))
        if price_max:
            shop_product_qs = shop_product_qs.filter(price__lte=float(price_max))

        # Apply rating filter
        if min_rating:
            shop_product_qs = shop_product_qs.filter(shop__rating__gte=float(min_rating))

        # Apply city filter
        if city:
            shop_product_qs = shop_product_qs.filter(shop__city__icontains=city)

        # Apply distance filter if user location is available
        if max_distance and user_lat and user_lon:
            nearby_shops = []
            for shop in Shop.objects.filter(is_approved=True, is_active=True):
                distance = shop.calculate_distance(user_lat, user_lon)
                if distance is not None and distance <= float(max_distance):
                    nearby_shops.append(shop.id)
            if nearby_shops:
                shop_product_qs = shop_product_qs.filter(shop__id__in=nearby_shops)

        # Apply sorting
        if sort_by == 'price_asc':
            shop_product_qs = shop_product_qs.order_by('price')
        elif sort_by == 'price_desc':
            shop_product_qs = shop_product_qs.order_by('-price')
        elif sort_by == 'rating':
            shop_product_qs = shop_product_qs.order_by('-shop__rating')
        elif sort_by == 'newest':
            shop_product_qs = shop_product_qs.order_by('-created_at')
        elif sort_by == 'distance' and user_lat and user_lon:
            # Distance sorting requires post-processing
            pass
        else:
            # Default relevance sorting
            shop_product_qs = shop_product_qs.order_by('-product__name')

        # Build shop queryset (only when text query present)
        if has_query:
            shop_qs = Shop.objects.filter(
                Q(name__icontains=query)
                | Q(description__icontains=query)
                | Q(address__icontains=query),
                is_approved=True,
                is_active=True,
            )
            if city:
                shop_qs = shop_qs.filter(city__icontains=city)
            if min_rating:
                shop_qs = shop_qs.filter(rating__gte=float(min_rating))
        else:
            shop_qs = Shop.objects.none()

        # Serialize results
        products_data = self._serialize_products(
            product_qs[:self.MAX_RESULTS], user_lat, user_lon
        )
        shops_data = self._serialize_shops(shop_qs[:20], user_lat, user_lon)
        shop_products_data = self._serialize_shop_products(
            shop_product_qs[:self.MAX_RESULTS], user_lat, user_lon
        )

        # Apply distance sorting if requested
        if sort_by == 'distance' and user_lat and user_lon:
            shop_products_data.sort(key=lambda x: x.get('distance_km', float('inf')))

        result = {
            'query': query,
            'category': category,
            'products': products_data,
            'shops': shops_data,
            'shop_products': shop_products_data,
            'total_results': len(products_data) + len(shops_data),
        }

        try:
            cache.set(cache_key, result, self.CACHE_TIMEOUT)
        except Exception:
            pass

        return result

    def get_suggestions(self, partial_query, category=None):
        """
        Get autocomplete suggestions for a partial query.
        Combines prefix matching with category-based related products.
        """
        if not partial_query or len(partial_query.strip()) < 2:
            return []

        partial_query = partial_query.strip()
        cache_key = f'suggestions:{partial_query}:{category}'
        try:
            cached = cache.get(cache_key)
            if cached:
                return cached
        except Exception:
            pass

        suggestions = []

        # 1. Prefix matching on product names
        product_qs = Product.objects.filter(
            name__istartswith=partial_query,
            is_active=True,
        )
        if category:
            product_qs = product_qs.filter(category=category.upper())

        for product in product_qs[:5]:
            suggestions.append({
                'type': 'product',
                'label': product.name,
                'category': product.category,
                'category_display': product.get_category_display(),
                'id': product.id,
            })

        # 2. Contains matching if prefix didn't fill up
        if len(suggestions) < self.MAX_SUGGESTIONS:
            contains_qs = Product.objects.filter(
                name__icontains=partial_query,
                is_active=True,
            ).exclude(name__istartswith=partial_query)
            if category:
                contains_qs = contains_qs.filter(category=category.upper())

            for product in contains_qs[:3]:
                suggestions.append({
                    'type': 'product',
                    'label': product.name,
                    'category': product.category,
                    'category_display': product.get_category_display(),
                    'id': product.id,
                })

        # 3. Category-based related products
        if suggestions and len(suggestions) < self.MAX_SUGGESTIONS:
            first_category = suggestions[0].get('category')
            if first_category:
                related_qs = Product.objects.filter(
                    category=first_category,
                    is_active=True,
                ).exclude(name__icontains=partial_query).order_by('?')[:3]

                for product in related_qs:
                    suggestions.append({
                        'type': 'related',
                        'label': product.name,
                        'category': product.category,
                        'category_display': product.get_category_display(),
                        'id': product.id,
                    })

        # 4. Shop name suggestions
        shop_qs = Shop.objects.filter(
            name__icontains=partial_query,
            is_approved=True,
            is_active=True,
        )[:3]

        for shop in shop_qs:
            suggestions.append({
                'type': 'shop',
                'label': shop.name,
                'city': shop.city,
                'id': shop.id,
            })

        # 5. Brand suggestions
        brand_qs = Product.objects.filter(
            brand__icontains=partial_query,
            is_active=True,
        ).values('brand').distinct()[:3]

        for item in brand_qs:
            if item['brand']:
                suggestions.append({
                    'type': 'brand',
                    'label': item['brand'],
                })

        result = suggestions[:self.MAX_SUGGESTIONS]
        try:
            cache.set(cache_key, result, self.CACHE_TIMEOUT)
        except Exception:
            pass

        return result

    def log_search(self, query, user=None, results_count=0):
        """Log a search query for analytics."""
        if not query:
            return
        try:
            from apps.analytics.models import SearchLog
            SearchLog.objects.create(
                user=user if user and user.is_authenticated else None,
                query=query,
                results_count=results_count,
            )
        except Exception as e:
            logger.warning(f'Failed to log search: {e}')

    def get_trending_searches(self, limit=10):
        """Return the most popular search queries."""
        try:
            from apps.analytics.models import SearchLog
            trending = (
                SearchLog.objects
                .values('query')
                .annotate(count=Count('id'))
                .order_by('-count')[:limit]
            )
            return list(trending)
        except Exception:
            return []

    def get_trending_products(self, limit=10):
        """Return the most viewed products."""
        try:
            from apps.analytics.models import ProductView
            trending = (
                ProductView.objects
                .values('product_id', 'product__name', 'product__category', 'product__image')
                .annotate(view_count=Count('id'))
                .order_by('-view_count')[:limit]
            )
            return list(trending)
        except Exception:
            return []

    # --- Private helpers ---

    def _empty_result(self, query):
        return {
            'query': query or '',
            'category': None,
            'products': [],
            'shops': [],
            'shop_products': [],
            'total_results': 0,
        }

    def _serialize_products(self, products, user_lat, user_lon):
        result = []
        for p in products:
            result.append({
                'id': p.id,
                'name': p.name,
                'category': p.category,
                'category_display': p.get_category_display(),
                'brand': p.brand,
                'unit': p.unit,
                'image': p.image.url if p.image else None,
                'min_price': p.get_min_price(),
                'max_price': p.get_max_price(),
                'shop_count': p.get_shop_count(),
            })
        return result

    def _serialize_shops(self, shops, user_lat, user_lon):
        result = []
        for shop in shops:
            distance = None
            if user_lat and user_lon:
                distance = shop.calculate_distance(user_lat, user_lon)
            result.append({
                'id': shop.id,
                'name': shop.name,
                'city': shop.city,
                'address': shop.address,
                'rating': float(shop.rating),
                'review_count': shop.review_count,
                'logo': shop.logo.url if shop.logo else None,
                'distance_km': distance,
                'latitude': float(shop.latitude) if shop.latitude else None,
                'longitude': float(shop.longitude) if shop.longitude else None,
            })
        return result

    def _serialize_shop_products(self, shop_products, user_lat, user_lon):
        result = []
        for sp in shop_products:
            distance = None
            if user_lat and user_lon:
                distance = sp.shop.calculate_distance(user_lat, user_lon)
            result.append({
                'id': sp.id,
                'product_id': sp.product.id,
                'product_name': sp.product.name,
                'product_image': sp.product.image.url if sp.product.image else None,
                'category': sp.product.category,
                'shop_id': sp.shop.id,
                'shop_name': sp.shop.name,
                'shop_city': sp.shop.city,
                'shop_rating': float(sp.shop.rating),
                'price': float(sp.price),
                'availability': sp.availability,
                'stock_quantity': sp.stock_quantity,
                'distance_km': distance,
                'latitude': float(sp.shop.latitude) if sp.shop.latitude else None,
                'longitude': float(sp.shop.longitude) if sp.shop.longitude else None,
            })
        return result
