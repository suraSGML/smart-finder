"""
Comparison Engine for Smart Local Product Finder.
Ranks shops by a weighted score combining price, distance, and availability.
"""
import math
import logging

logger = logging.getLogger(__name__)


class ComparisonEngine:
    """
    Compares shop-product entries and ranks them using a weighted scoring algorithm.

    Scoring weights:
        - Price score:        40%  (cheaper = higher score)
        - Distance score:     35%  (closer = higher score)
        - Availability score: 25%  (in stock = 100, out of stock = 0)
    """

    PRICE_WEIGHT = 0.40
    DISTANCE_WEIGHT = 0.35
    AVAILABILITY_WEIGHT = 0.25

    def compare(self, shop_products, user_lat=None, user_lon=None):
        """
        Compare a list of ShopProduct objects and return a ranked list.

        Args:
            shop_products: QuerySet or list of ShopProduct instances
            user_lat (float): User's latitude
            user_lon (float): User's longitude

        Returns:
            dict: {
                'ranked': list of ranked shop-product dicts,
                'best_choice': dict (highest overall score),
                'cheapest': dict (lowest price),
                'nearest': dict (shortest distance),
                'summary': dict with price range and shop count,
            }
        """
        if not shop_products:
            return self._empty_result()

        items = list(shop_products)
        if not items:
            return self._empty_result()

        # Build raw data list
        raw = []
        for sp in items:
            distance = None
            if user_lat and user_lon and sp.shop.latitude and sp.shop.longitude:
                distance = self._haversine(
                    float(user_lat), float(user_lon),
                    float(sp.shop.latitude), float(sp.shop.longitude),
                )
            raw.append({
                'shop_product_id': sp.id,
                'shop_id': sp.shop.id,
                'shop_name': sp.shop.name,
                'shop_address': sp.shop.address,
                'shop_city': sp.shop.city,
                'shop_rating': float(sp.shop.rating),
                'shop_review_count': sp.shop.review_count,
                'shop_logo': sp.shop.logo.url if sp.shop.logo else None,
                'shop_phone': sp.shop.phone,
                'shop_latitude': float(sp.shop.latitude) if sp.shop.latitude else None,
                'shop_longitude': float(sp.shop.longitude) if sp.shop.longitude else None,
                'product_id': sp.product.id,
                'product_name': sp.product.name,
                'product_image': sp.product.image.url if sp.product.image else None,
                'price': float(sp.price),
                'availability': sp.availability,
                'stock_quantity': sp.stock_quantity,
                'notes': sp.notes,
                'distance_km': distance,
            })

        # Compute score ranges
        prices = [r['price'] for r in raw]
        distances = [r['distance_km'] for r in raw if r['distance_km'] is not None]

        min_price = min(prices)
        max_price = max(prices)
        min_dist = min(distances) if distances else 0
        max_dist = max(distances) if distances else 0

        # Score each item
        for item in raw:
            price_score = self._normalize_price(item['price'], min_price, max_price)
            distance_score = self._normalize_distance(item['distance_km'], min_dist, max_dist)
            availability_score = 100.0 if item['availability'] else 0.0

            item['price_score'] = round(price_score, 2)
            item['distance_score'] = round(distance_score, 2)
            item['availability_score'] = availability_score
            item['final_score'] = round(
                self.calculate_score(price_score, distance_score, availability_score), 2
            )

        # Sort by final score descending
        ranked = sorted(raw, key=lambda x: x['final_score'], reverse=True)

        # Assign rank
        for i, item in enumerate(ranked):
            item['rank'] = i + 1

        # Identify special labels
        best_choice = ranked[0] if ranked else None
        cheapest = min(raw, key=lambda x: x['price']) if raw else None
        nearest = min(
            [r for r in raw if r['distance_km'] is not None],
            key=lambda x: x['distance_km'],
            default=None,
        )

        # Add labels
        if best_choice:
            best_choice['label'] = 'best_choice'
        if cheapest and cheapest != best_choice:
            cheapest['label'] = 'cheapest'
        if nearest and nearest not in (best_choice, cheapest):
            nearest['label'] = 'nearest'

        return {
            'ranked': ranked,
            'best_choice': best_choice,
            'cheapest': cheapest,
            'nearest': nearest,
            'summary': {
                'total_shops': len(ranked),
                'min_price': min_price,
                'max_price': max_price,
                'price_range': round(max_price - min_price, 2),
                'has_location_data': len(distances) > 0,
            },
        }

    def calculate_score(self, price_score, distance_score, availability_score):
        """
        Calculate the final weighted score.

        Formula:
            final_score = (price_score * 0.40) + (distance_score * 0.35) + (availability_score * 0.25)

        Args:
            price_score (float): 0-100, higher = cheaper
            distance_score (float): 0-100, higher = closer
            availability_score (float): 100 if in stock, 0 otherwise

        Returns:
            float: Final score 0-100
        """
        return (
            (price_score * self.PRICE_WEIGHT)
            + (distance_score * self.DISTANCE_WEIGHT)
            + (availability_score * self.AVAILABILITY_WEIGHT)
        )

    def _normalize_price(self, price, min_price, max_price):
        """
        Normalize price to 0-100 score where cheaper = higher score.
        price_score = (max_price - price) / (max_price - min_price) * 100
        """
        if max_price == min_price:
            return 100.0  # All prices are the same
        return ((max_price - price) / (max_price - min_price)) * 100

    def _normalize_distance(self, distance, min_dist, max_dist):
        """
        Normalize distance to 0-100 score where closer = higher score.
        distance_score = (max_dist - distance) / (max_dist - min_dist) * 100
        """
        if distance is None:
            return 50.0  # Neutral score when no location data
        if max_dist == min_dist:
            return 100.0  # All distances are the same
        return ((max_dist - distance) / (max_dist - min_dist)) * 100

    def _haversine(self, lat1, lon1, lat2, lon2):
        """
        Calculate the great-circle distance between two points using the Haversine formula.
        Returns distance in kilometers.
        """
        R = 6371  # Earth's radius in km

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 3)

    def _empty_result(self):
        return {
            'ranked': [],
            'best_choice': None,
            'cheapest': None,
            'nearest': None,
            'summary': {
                'total_shops': 0,
                'min_price': None,
                'max_price': None,
                'price_range': 0,
                'has_location_data': False,
            },
        }
