"""
Views for the smart search engine.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers as drf_serializers

from .engine import SmartSearchEngine

_search_response = inline_serializer(
    name='SearchResponse',
    fields={
        'query': drf_serializers.CharField(),
        'total_results': drf_serializers.IntegerField(),
        'products': drf_serializers.ListField(child=drf_serializers.DictField()),
        'shops': drf_serializers.ListField(child=drf_serializers.DictField()),
        'shop_products': drf_serializers.ListField(child=drf_serializers.DictField()),
    },
)

_suggestions_response = inline_serializer(
    name='SuggestionsResponse',
    fields={'suggestions': drf_serializers.ListField(child=drf_serializers.DictField())},
)

_trending_response = inline_serializer(
    name='TrendingResponse',
    fields={
        'trending_searches': drf_serializers.ListField(child=drf_serializers.DictField()),
        'trending_products': drf_serializers.ListField(child=drf_serializers.DictField()),
    },
)


@extend_schema(
    parameters=[
        OpenApiParameter('q', str, description='Search query (required)'),
        OpenApiParameter('category', str, description='Filter by category'),
        OpenApiParameter('city', str, description='Filter by city'),
        OpenApiParameter('lat', float, description='User latitude for distance sorting'),
        OpenApiParameter('lon', float, description='User longitude for distance sorting'),
        OpenApiParameter('price_min', float, description='Minimum price filter'),
        OpenApiParameter('price_max', float, description='Maximum price filter'),
        OpenApiParameter('min_rating', float, description='Minimum rating filter'),
        OpenApiParameter('distance', float, description='Maximum distance in km'),
        OpenApiParameter('sort_by', str, description='Sort by: relevance, price_asc, price_desc, rating, newest, distance'),
    ],
    responses={200: _search_response},
)
class SearchView(APIView):
    """
    Smart product and shop search endpoint.
    Supports location-aware results and category filtering.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        category = request.query_params.get('category', None)
        city = request.query_params.get('city', None)
        price_min = request.query_params.get('price_min')
        price_max = request.query_params.get('price_max')
        min_rating = request.query_params.get('min_rating')
        max_distance = request.query_params.get('distance')
        sort_by = request.query_params.get('sort_by', 'relevance')

        try:
            user_lat = float(request.query_params.get('lat', 0)) or None
            user_lon = float(request.query_params.get('lon', 0)) or None
        except (TypeError, ValueError):
            user_lat = None
            user_lon = None

        if not (user_lat and user_lon) and request.user.is_authenticated:
            user_lat = float(request.user.latitude) if request.user.latitude else None
            user_lon = float(request.user.longitude) if request.user.longitude else None

        if not query and not category:
            return Response(
                {'error': 'Search query "q" or "category" is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        engine = SmartSearchEngine()
        results = engine.search(
            query=query,
            user_lat=user_lat,
            user_lon=user_lon,
            category=category,
            city=city,
            price_min=price_min,
            price_max=price_max,
            min_rating=min_rating,
            max_distance=max_distance,
            sort_by=sort_by,
        )

        engine.log_search(
            query=query,
            user=request.user,
            results_count=results['total_results'],
        )

        return Response(results)


@extend_schema(
    parameters=[
        OpenApiParameter('q', str, description='Partial search query (min 2 chars)'),
        OpenApiParameter('category', str, description='Filter suggestions by category'),
    ],
    responses={200: _suggestions_response},
)
class SuggestionsView(APIView):
    """
    Autocomplete suggestions for the search bar.
    Returns prefix-matched and category-related suggestions.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        partial = request.query_params.get('q', '').strip()
        category = request.query_params.get('category', None)

        if len(partial) < 2:
            return Response({'suggestions': []})

        engine = SmartSearchEngine()
        suggestions = engine.get_suggestions(partial, category=category)

        return Response({'suggestions': suggestions})


@extend_schema(responses={200: _trending_response})
class TrendingView(APIView):
    """Return trending searches and products."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        engine = SmartSearchEngine()
        return Response({
            'trending_searches': engine.get_trending_searches(limit=10),
            'trending_products': engine.get_trending_products(limit=10),
        })
