"""
Views for the price and distance comparison engine.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers as drf_serializers
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

from apps.products.models import Product, ShopProduct
from .engine import ComparisonEngine

_product_info = inline_serializer(
    name='CompareProductInfo',
    fields={
        'id': drf_serializers.IntegerField(),
        'name': drf_serializers.CharField(),
        'category': drf_serializers.CharField(),
        'category_display': drf_serializers.CharField(),
        'image': drf_serializers.CharField(allow_null=True),
        'brand': drf_serializers.CharField(allow_null=True),
        'unit': drf_serializers.CharField(),
    },
)

_comparison_result = inline_serializer(
    name='ComparisonResult',
    fields={
        'product': _product_info,
        'comparison': drf_serializers.DictField(),
    },
)

_multi_comparison_result = inline_serializer(
    name='MultiComparisonResult',
    fields={'results': drf_serializers.ListField(child=drf_serializers.DictField())},
)


@extend_schema(
    parameters=[
        OpenApiParameter('lat', float, description='User latitude for distance calculation'),
        OpenApiParameter('lon', float, description='User longitude for distance calculation'),
        OpenApiParameter('city', str, description='Filter shops by city'),
    ],
    responses={200: _comparison_result},
)
class CompareProductView(APIView):
    """
    Compare prices and distances for a specific product across all shops.
    Returns a ranked list with best_choice, cheapest, and nearest labels.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_lat = float(request.query_params.get('lat', 0)) or None
            user_lon = float(request.query_params.get('lon', 0)) or None
        except (TypeError, ValueError):
            user_lat = None
            user_lon = None

        if not (user_lat and user_lon) and request.user.is_authenticated:
            user_lat = float(request.user.latitude) if request.user.latitude else None
            user_lon = float(request.user.longitude) if request.user.longitude else None

        city = request.query_params.get('city', None)

        shop_products = ShopProduct.objects.filter(
            product=product,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('shop', 'product')

        if city:
            shop_products = shop_products.filter(shop__city__icontains=city)

        engine = ComparisonEngine()
        comparison = engine.compare(shop_products, user_lat=user_lat, user_lon=user_lon)

        try:
            from apps.analytics.models import ProductView
            ProductView.objects.create(
                product=product,
                user=request.user if request.user.is_authenticated else None,
            )
        except Exception:
            pass

        return Response({
            'product': {
                'id': product.id,
                'name': product.name,
                'category': product.category,
                'category_display': product.get_category_display(),
                'image': product.image.url if product.image else None,
                'brand': product.brand,
                'unit': product.unit,
            },
            'comparison': comparison,
        })


@extend_schema(
    parameters=[
        OpenApiParameter('ids', str, description='Comma-separated product IDs, e.g. 1,2,3'),
        OpenApiParameter('lat', float, description='User latitude'),
        OpenApiParameter('lon', float, description='User longitude'),
    ],
    responses={200: _multi_comparison_result},
)
class CompareMultipleProductsView(APIView):
    """
    Compare multiple products side by side.
    Accepts a comma-separated list of product IDs.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        product_ids_str = request.query_params.get('ids', '')
        if not product_ids_str:
            return Response(
                {'error': 'Product IDs are required. Use ?ids=1,2,3'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_ids = [int(pid.strip()) for pid in product_ids_str.split(',') if pid.strip()]
        except ValueError:
            return Response({'error': 'Invalid product IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(product_ids) > 10:
            return Response(
                {'error': 'Maximum 10 products can be compared at once.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_lat = float(request.query_params.get('lat', 0)) or None
            user_lon = float(request.query_params.get('lon', 0)) or None
        except (TypeError, ValueError):
            user_lat = None
            user_lon = None

        if not (user_lat and user_lon) and request.user.is_authenticated:
            user_lat = float(request.user.latitude) if request.user.latitude else None
            user_lon = float(request.user.longitude) if request.user.longitude else None

        engine = ComparisonEngine()
        results = []

        for product_id in product_ids:
            try:
                product = Product.objects.get(pk=product_id, is_active=True)
                shop_products = ShopProduct.objects.filter(
                    product=product,
                    shop__is_approved=True,
                    shop__is_active=True,
                ).select_related('shop', 'product')
                comparison = engine.compare(shop_products, user_lat=user_lat, user_lon=user_lon)
                results.append({
                    'product': {
                        'id': product.id,
                        'name': product.name,
                        'category': product.category,
                        'image': product.image.url if product.image else None,
                    },
                    'comparison': comparison,
                })
            except Product.DoesNotExist:
                results.append({
                    'product': {'id': product_id, 'error': 'Not found'},
                    'comparison': engine._empty_result(),
                })

        return Response({'results': results})


@extend_schema(
    parameters=[
        OpenApiParameter('lat', float, description='User latitude'),
        OpenApiParameter('lon', float, description='User longitude'),
        OpenApiParameter('city', str, description='Filter shops by city'),
    ],
    responses={200: 'application/pdf'},
)
class ExportComparisonPDFView(APIView):
    """Export price comparison results as PDF."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            user_lat = float(request.query_params.get('lat', 0)) or None
            user_lon = float(request.query_params.get('lon', 0)) or None
        except (TypeError, ValueError):
            user_lat = None
            user_lon = None

        city = request.query_params.get('city', None)

        shop_products = ShopProduct.objects.filter(
            product=product,
            shop__is_approved=True,
            shop__is_active=True,
        ).select_related('shop', 'product')

        if city:
            shop_products = shop_products.filter(shop__city__icontains=city)

        engine = ComparisonEngine()
        comparison = engine.compare(shop_products, user_lat=user_lat, user_lon=user_lon)

        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title = Paragraph(f"Price Comparison: {product.name}", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))

        # Product info
        product_info = f"Category: {product.get_category_display()} | Brand: {product.brand or 'N/A'}"
        story.append(Paragraph(product_info, styles['Normal']))
        story.append(Spacer(1, 12))

        # Summary
        summary = comparison['summary']
        summary_text = f"Total Shops: {summary['total_shops']} | Price Range: ETB {summary['min_price']} - {summary['max_price']}"
        story.append(Paragraph(summary_text, styles['Normal']))
        story.append(Spacer(1, 24))

        # Comparison table
        if comparison['ranked']:
            data = [['Shop', 'Price (ETB)', 'Distance (km)', 'Availability', 'Score']]
            for item in comparison['ranked']:
                availability = 'In Stock' if item['availability'] else 'Out of Stock'
                distance = f"{item['distance_km']:.2f}" if item['distance_km'] else 'N/A'
                data.append([
                    item['shop_name'],
                    f"{item['price']:.2f}",
                    distance,
                    availability,
                    f"{item['final_score']:.1f}"
                ])

            table = Table(data, colWidths=[3*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(table)

        doc.build(story)
        buffer.seek(0)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="comparison_{product.name.replace(" ", "_")}.pdf"'
        return response
