"""
Management command to seed the database with initial Ethiopian products and shops.
Run: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Product, ShopProduct
from apps.shops.models import Shop

User = get_user_model()

PRODUCTS = [
    # Electronics
    {'name': 'Samsung Galaxy A54', 'category': 'ELECTRONICS', 'brand': 'Samsung', 'unit': 'piece', 'tags': 'phone,smartphone,android,samsung'},
    {'name': 'Tecno Spark 10', 'category': 'ELECTRONICS', 'brand': 'Tecno', 'unit': 'piece', 'tags': 'phone,smartphone,android,tecno'},
    {'name': 'Itel A70', 'category': 'ELECTRONICS', 'brand': 'Itel', 'unit': 'piece', 'tags': 'phone,smartphone,android,itel'},
    {'name': 'Infinix Hot 30', 'category': 'ELECTRONICS', 'brand': 'Infinix', 'unit': 'piece', 'tags': 'phone,smartphone,android'},
    {'name': 'LG 43" Smart TV', 'category': 'ELECTRONICS', 'brand': 'LG', 'unit': 'piece', 'tags': 'tv,television,smart tv,lg'},
    {'name': 'Samsung 32" LED TV', 'category': 'ELECTRONICS', 'brand': 'Samsung', 'unit': 'piece', 'tags': 'tv,television,led,samsung'},
    {'name': 'HP Laptop 15s', 'category': 'ELECTRONICS', 'brand': 'HP', 'unit': 'piece', 'tags': 'laptop,computer,hp'},
    {'name': 'Lenovo IdeaPad 3', 'category': 'ELECTRONICS', 'brand': 'Lenovo', 'unit': 'piece', 'tags': 'laptop,computer,lenovo'},
    {'name': 'Bluetooth Speaker JBL Go 3', 'category': 'ELECTRONICS', 'brand': 'JBL', 'unit': 'piece', 'tags': 'speaker,bluetooth,audio,jbl'},
    {'name': 'USB-C Charger 65W', 'category': 'ELECTRONICS', 'brand': 'Generic', 'unit': 'piece', 'tags': 'charger,usb-c,adapter'},
    # Food
    {'name': 'Teff Flour (Injera Grade)', 'category': 'FOOD', 'brand': 'Local', 'unit': 'kg', 'tags': 'teff,flour,injera,grain'},
    {'name': 'White Wheat Flour', 'category': 'FOOD', 'brand': 'Dire Dawa Food Complex', 'unit': 'kg', 'tags': 'flour,wheat,bread'},
    {'name': 'Sunflower Cooking Oil', 'category': 'FOOD', 'brand': 'Walia', 'unit': 'liter', 'tags': 'oil,cooking,sunflower'},
    {'name': 'Berbere Spice Mix', 'category': 'FOOD', 'brand': 'Local', 'unit': 'kg', 'tags': 'spice,berbere,ethiopian'},
    {'name': 'Mitmita Spice', 'category': 'FOOD', 'brand': 'Local', 'unit': 'kg', 'tags': 'spice,mitmita,hot'},
    {'name': 'Basmati Rice', 'category': 'FOOD', 'brand': 'India Gate', 'unit': 'kg', 'tags': 'rice,basmati,grain'},
    {'name': 'Lentils (Misir)', 'category': 'FOOD', 'brand': 'Local', 'unit': 'kg', 'tags': 'lentils,misir,legume'},
    {'name': 'Chickpeas (Shimbra)', 'category': 'FOOD', 'brand': 'Local', 'unit': 'kg', 'tags': 'chickpeas,shimbra,legume'},
    {'name': 'Tomato Paste 400g', 'category': 'FOOD', 'brand': 'Heinz', 'unit': 'piece', 'tags': 'tomato,paste,sauce'},
    {'name': 'Sugar (White)', 'category': 'FOOD', 'brand': 'Wonji Sugar', 'unit': 'kg', 'tags': 'sugar,sweet'},
    # Clothing
    {'name': 'Ethiopian Traditional Habesha Kemis', 'category': 'CLOTHING', 'brand': 'Local Weaver', 'unit': 'piece', 'tags': 'habesha,kemis,traditional,dress'},
    {'name': 'Men\'s Formal Shirt', 'category': 'CLOTHING', 'brand': 'Generic', 'unit': 'piece', 'tags': 'shirt,formal,men'},
    {'name': 'Jeans Trousers', 'category': 'CLOTHING', 'brand': 'Generic', 'unit': 'piece', 'tags': 'jeans,trousers,denim'},
    {'name': 'Leather Shoes Men', 'category': 'CLOTHING', 'brand': 'Peacock', 'unit': 'piece', 'tags': 'shoes,leather,men,footwear'},
    {'name': 'Women\'s Sandals', 'category': 'CLOTHING', 'brand': 'Generic', 'unit': 'piece', 'tags': 'sandals,women,footwear'},
    # Household
    {'name': 'Injera Mitad (Electric)', 'category': 'HOUSEHOLD', 'brand': 'Mirt', 'unit': 'piece', 'tags': 'mitad,injera,electric,cooking'},
    {'name': 'Pressure Cooker 5L', 'category': 'HOUSEHOLD', 'brand': 'Prestige', 'unit': 'piece', 'tags': 'pressure cooker,kitchen,cooking'},
    {'name': 'Plastic Water Bucket 20L', 'category': 'HOUSEHOLD', 'brand': 'Generic', 'unit': 'piece', 'tags': 'bucket,water,plastic'},
    {'name': 'Broom (Metate)', 'category': 'HOUSEHOLD', 'brand': 'Local', 'unit': 'piece', 'tags': 'broom,cleaning,metate'},
    {'name': 'Mattress Single 3.5"', 'category': 'HOUSEHOLD', 'brand': 'Peacock', 'unit': 'piece', 'tags': 'mattress,bed,sleep'},
    # Health
    {'name': 'Paracetamol 500mg (Strip)', 'category': 'HEALTH', 'brand': 'Generic', 'unit': 'piece', 'tags': 'paracetamol,medicine,pain relief'},
    {'name': 'Amoxicillin 500mg (Strip)', 'category': 'HEALTH', 'brand': 'Generic', 'unit': 'piece', 'tags': 'amoxicillin,antibiotic,medicine'},
    {'name': 'Vaseline Petroleum Jelly 250ml', 'category': 'HEALTH', 'brand': 'Vaseline', 'unit': 'piece', 'tags': 'vaseline,skin,moisturizer'},
    {'name': 'Soap Bar (Lux)', 'category': 'HEALTH', 'brand': 'Lux', 'unit': 'piece', 'tags': 'soap,hygiene,bath'},
    {'name': 'Toothpaste Colgate 100ml', 'category': 'HEALTH', 'brand': 'Colgate', 'unit': 'piece', 'tags': 'toothpaste,dental,hygiene'},
    # Agriculture
    {'name': 'DAP Fertilizer 50kg', 'category': 'AGRICULTURE', 'brand': 'ATA', 'unit': 'piece', 'tags': 'fertilizer,dap,agriculture'},
    {'name': 'Urea Fertilizer 50kg', 'category': 'AGRICULTURE', 'brand': 'ATA', 'unit': 'piece', 'tags': 'fertilizer,urea,agriculture'},
    {'name': 'Maize Seeds 5kg', 'category': 'AGRICULTURE', 'brand': 'Pioneer', 'unit': 'piece', 'tags': 'seeds,maize,corn,agriculture'},
    {'name': 'Hand Hoe (Maresha)', 'category': 'AGRICULTURE', 'brand': 'Local', 'unit': 'piece', 'tags': 'hoe,tool,farming,maresha'},
    {'name': 'Pesticide Spray 1L', 'category': 'AGRICULTURE', 'brand': 'Generic', 'unit': 'piece', 'tags': 'pesticide,spray,agriculture'},
]

SHOPS = [
    {
        'name': 'Merkato Electronics Hub',
        'address': 'Merkato, Addis Ketema',
        'city': 'Addis Ababa',
        'sub_city': 'Addis Ketema',
        'phone': '+251911234567',
        'latitude': 9.0350,
        'longitude': 38.7400,
        'description': 'Leading electronics retailer in Merkato with competitive prices.',
    },
    {
        'name': 'Bole Road Supermarket',
        'address': 'Bole Road, Near Edna Mall',
        'city': 'Addis Ababa',
        'sub_city': 'Bole',
        'phone': '+251922345678',
        'latitude': 8.9950,
        'longitude': 38.7900,
        'description': 'Full-service supermarket with fresh produce and household items.',
    },
    {
        'name': 'Piassa General Store',
        'address': 'Piassa, Churchill Avenue',
        'city': 'Addis Ababa',
        'sub_city': 'Arada',
        'phone': '+251933456789',
        'latitude': 9.0350,
        'longitude': 38.7600,
        'description': 'General merchandise store serving Piassa since 1985.',
    },
    {
        'name': 'Kazanchis Tech Shop',
        'address': 'Kazanchis, Near Hilton',
        'city': 'Addis Ababa',
        'sub_city': 'Kirkos',
        'phone': '+251944567890',
        'latitude': 9.0200,
        'longitude': 38.7650,
        'description': 'Phones, laptops, and accessories at wholesale prices.',
    },
    {
        'name': 'Megenagna Market',
        'address': 'Megenagna Square',
        'city': 'Addis Ababa',
        'sub_city': 'Yeka',
        'phone': '+251955678901',
        'latitude': 9.0100,
        'longitude': 38.8100,
        'description': 'Large open market with food, clothing, and household goods.',
    },
]


class Command(BaseCommand):
    help = 'Seed the database with initial Ethiopian products and shops'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing products and shops...')
            ShopProduct.objects.all().delete()
            Product.objects.all().delete()
            Shop.objects.filter(name__in=[s['name'] for s in SHOPS]).delete()

        # Create or get a demo shop owner
        owner, created = User.objects.get_or_create(
            username='demo_owner',
            defaults={
                'email': 'demo@smartfinder.et',
                'first_name': 'Demo',
                'last_name': 'Owner',
                'role': 'SHOP_OWNER',
                'is_verified': True,
            }
        )
        if created:
            owner.set_password('Demo@1234')
            owner.save()
            self.stdout.write(f'  Created demo shop owner: demo_owner / Demo@1234')

        # Create products
        created_products = []
        for p in PRODUCTS:
            product, _ = Product.objects.get_or_create(
                name=p['name'],
                defaults={
                    'category': p['category'],
                    'brand': p.get('brand', ''),
                    'unit': p.get('unit', 'piece'),
                    'tags': p.get('tags', ''),
                    'is_active': True,
                }
            )
            created_products.append(product)
        self.stdout.write(f'  Created/verified {len(created_products)} products')

        # Create shops
        import random
        created_shops = []
        for s in SHOPS:
            shop, _ = Shop.objects.get_or_create(
                name=s['name'],
                defaults={
                    **s,
                    'owner': owner,
                    'is_approved': True,
                    'is_active': True,
                }
            )
            created_shops.append(shop)
        self.stdout.write(f'  Created/verified {len(created_shops)} shops')

        # Link products to shops with realistic prices
        BASE_PRICES = {
            'ELECTRONICS': (500, 80000),
            'FOOD': (20, 500),
            'CLOTHING': (150, 3000),
            'HOUSEHOLD': (50, 5000),
            'HEALTH': (10, 500),
            'AGRICULTURE': (100, 3000),
        }
        sp_count = 0
        for shop in created_shops:
            # Each shop carries a random subset of products
            shop_products = random.sample(created_products, min(15, len(created_products)))
            for product in shop_products:
                low, high = BASE_PRICES.get(product.category, (50, 1000))
                price = round(random.uniform(low, high), 2)
                ShopProduct.objects.get_or_create(
                    shop=shop,
                    product=product,
                    defaults={
                        'price': price,
                        'availability': random.choice([True, True, True, False]),
                        'stock_quantity': random.randint(1, 100),
                    }
                )
                sp_count += 1
        self.stdout.write(f'  Created/verified {sp_count} shop-product links')
        self.stdout.write(self.style.SUCCESS('Seed data complete!'))
