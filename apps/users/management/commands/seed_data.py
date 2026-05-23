"""
Management command to seed the database with realistic Ethiopian market data.
Usage: python manage.py seed_data
       python manage.py seed_data --clear   (wipe existing data first)
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Seed the database with Ethiopian market sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing seed data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_data()

        self.stdout.write(self.style.MIGRATE_HEADING('\n🌱 Seeding Smart Finder database...\n'))

        users = self.create_users()
        shops = self.create_shops(users)
        products = self.create_products()
        self.create_shop_products(shops, products)
        self.create_reviews(users, shops)

        self.stdout.write(self.style.SUCCESS('\n✅ Seed complete!\n'))
        self.stdout.write('  Admin login:       admin@smartfinder.et  /  Admin1234!')
        self.stdout.write('  Shop owner login:  owner1@smartfinder.et /  Owner1234!')
        self.stdout.write('  Customer login:    customer1@smartfinder.et / Customer1234!\n')

    # ------------------------------------------------------------------
    def clear_data(self):
        from apps.reviews.models import Review
        from apps.products.models import ShopProduct, Product
        from apps.shops.models import Shop
        from apps.users.models import User

        self.stdout.write('🗑  Clearing existing data...')
        Review.objects.all().delete()
        ShopProduct.objects.all().delete()
        Product.objects.all().delete()
        Shop.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.WARNING('   Cleared.\n'))

    # ------------------------------------------------------------------
    def create_users(self):
        from apps.users.models import User

        self.stdout.write('👤 Creating users...')

        hashed_admin    = make_password('Admin1234!')
        hashed_owner    = make_password('Owner1234!')
        hashed_customer = make_password('Customer1234!')

        users_data = [
            # Admins
            dict(username='admin_sf', email='admin@smartfinder.et',
                 first_name='Abebe', last_name='Girma',
                 role='ADMIN', password=hashed_admin,
                 is_staff=True, is_superuser=False, is_verified=True),

            # Shop owners
            dict(username='owner1', email='owner1@smartfinder.et',
                 first_name='Tigist', last_name='Haile',
                 role='SHOP_OWNER', password=hashed_owner, is_verified=True,
                 latitude=Decimal('9.0192'), longitude=Decimal('38.7525')),
            dict(username='owner2', email='owner2@smartfinder.et',
                 first_name='Dawit', last_name='Bekele',
                 role='SHOP_OWNER', password=hashed_owner, is_verified=True,
                 latitude=Decimal('9.0300'), longitude=Decimal('38.7600')),
            dict(username='owner3', email='owner3@smartfinder.et',
                 first_name='Meron', last_name='Tadesse',
                 role='SHOP_OWNER', password=hashed_owner, is_verified=True,
                 latitude=Decimal('9.0050'), longitude=Decimal('38.7800')),
            dict(username='owner4', email='owner4@smartfinder.et',
                 first_name='Yonas', last_name='Alemu',
                 role='SHOP_OWNER', password=hashed_owner, is_verified=True,
                 latitude=Decimal('9.0400'), longitude=Decimal('38.7450')),
            dict(username='owner5', email='owner5@smartfinder.et',
                 first_name='Hana', last_name='Tesfaye',
                 role='SHOP_OWNER', password=hashed_owner, is_verified=True,
                 latitude=Decimal('8.9950'), longitude=Decimal('38.7700')),

            # Customers
            dict(username='customer1', email='customer1@smartfinder.et',
                 first_name='Selam', last_name='Worku',
                 role='CUSTOMER', password=hashed_customer, is_verified=True,
                 latitude=Decimal('9.0150'), longitude=Decimal('38.7550')),
            dict(username='customer2', email='customer2@smartfinder.et',
                 first_name='Biruk', last_name='Mengistu',
                 role='CUSTOMER', password=hashed_customer, is_verified=True,
                 latitude=Decimal('9.0250'), longitude=Decimal('38.7650')),
            dict(username='customer3', email='customer3@smartfinder.et',
                 first_name='Liya', last_name='Solomon',
                 role='CUSTOMER', password=hashed_customer, is_verified=True,
                 latitude=Decimal('9.0100'), longitude=Decimal('38.7480')),
        ]

        created = []
        for data in users_data:
            user, made = User.objects.get_or_create(
                email=data['email'],
                defaults=data,
            )
            created.append(user)

        self.stdout.write(self.style.SUCCESS(f'   ✓ {len(created)} users'))
        result = {}
        for u in created:
            result.setdefault(u.role, []).append(u)
        return result

    # ------------------------------------------------------------------
    def create_shops(self, users_by_role):
        from apps.shops.models import Shop

        self.stdout.write('🏪 Creating shops...')

        owners = users_by_role.get('SHOP_OWNER', [])
        if not owners:
            from apps.users.models import User
            owners = list(User.objects.filter(role='SHOP_OWNER'))

        shops_data = [
            dict(
                owner=owners[0],
                name='Merkato Electronics Hub',
                description='Your one-stop shop for all electronics in Merkato. Phones, laptops, accessories and more.',
                address='Merkato, Addis Ketema Sub-city',
                city='Addis Ababa', sub_city='Addis Ketema', woreda='08',
                latitude=Decimal('9.0192'), longitude=Decimal('38.7525'),
                phone='+251911234567', email='merkato.electronics@gmail.com',
                is_approved=True, is_active=True, rating=Decimal('4.50'), review_count=24,
                opening_hours={'monday': '8:00-20:00', 'tuesday': '8:00-20:00',
                               'wednesday': '8:00-20:00', 'thursday': '8:00-20:00',
                               'friday': '8:00-18:00', 'saturday': '9:00-20:00',
                               'sunday': '10:00-18:00'},
            ),
            dict(
                owner=owners[1],
                name='Bole Tech Store',
                description='Premium electronics and gadgets in the heart of Bole. Authorized dealer for Samsung and Apple.',
                address='Bole Road, near Edna Mall',
                city='Addis Ababa', sub_city='Bole', woreda='03',
                latitude=Decimal('9.0300'), longitude=Decimal('38.7600'),
                phone='+251922345678', email='boletech@gmail.com',
                is_approved=True, is_active=True, rating=Decimal('4.70'), review_count=38,
                opening_hours={'monday': '9:00-21:00', 'tuesday': '9:00-21:00',
                               'wednesday': '9:00-21:00', 'thursday': '9:00-21:00',
                               'friday': '9:00-19:00', 'saturday': '9:00-21:00',
                               'sunday': '11:00-19:00'},
            ),
            dict(
                owner=owners[2],
                name='Piassa General Store',
                description='Household items, clothing and daily essentials. Serving Addis Ababa since 1998.',
                address='Piassa, Churchill Avenue',
                city='Addis Ababa', sub_city='Arada', woreda='05',
                latitude=Decimal('9.0050'), longitude=Decimal('38.7800'),
                phone='+251933456789', email='piassa.general@gmail.com',
                is_approved=True, is_active=True, rating=Decimal('4.20'), review_count=15,
                opening_hours={'monday': '7:30-19:00', 'tuesday': '7:30-19:00',
                               'wednesday': '7:30-19:00', 'thursday': '7:30-19:00',
                               'friday': '7:30-17:00', 'saturday': '8:00-19:00'},
            ),
            dict(
                owner=owners[3],
                name='CMC Health & Beauty',
                description='Health products, cosmetics, and beauty supplies. Imported and local brands.',
                address='CMC Road, Yeka Sub-city',
                city='Addis Ababa', sub_city='Yeka', woreda='12',
                latitude=Decimal('9.0400'), longitude=Decimal('38.7450'),
                phone='+251944567890', email='cmc.health@gmail.com',
                is_approved=True, is_active=True, rating=Decimal('4.40'), review_count=20,
                opening_hours={'monday': '8:00-20:00', 'tuesday': '8:00-20:00',
                               'wednesday': '8:00-20:00', 'thursday': '8:00-20:00',
                               'friday': '8:00-18:00', 'saturday': '9:00-20:00'},
            ),
            dict(
                owner=owners[4],
                name='Kazanchis Food Market',
                description='Fresh groceries, imported foods, and local produce. Best prices in Kazanchis.',
                address='Kazanchis, near National Theatre',
                city='Addis Ababa', sub_city='Kirkos', woreda='07',
                latitude=Decimal('8.9950'), longitude=Decimal('38.7700'),
                phone='+251955678901', email='kazanchis.food@gmail.com',
                is_approved=True, is_active=True, rating=Decimal('4.30'), review_count=31,
                opening_hours={'monday': '6:00-21:00', 'tuesday': '6:00-21:00',
                               'wednesday': '6:00-21:00', 'thursday': '6:00-21:00',
                               'friday': '6:00-20:00', 'saturday': '6:00-21:00',
                               'sunday': '7:00-20:00'},
            ),
        ]

        created = []
        for data in shops_data:
            shop, _ = Shop.objects.get_or_create(name=data['name'], defaults=data)
            created.append(shop)

        self.stdout.write(self.style.SUCCESS(f'   ✓ {len(created)} shops'))
        return created

    # ------------------------------------------------------------------
    def create_products(self):
        from apps.products.models import Product

        self.stdout.write('📦 Creating products...')

        products_data = [
            # --- ELECTRONICS ---
            dict(name='Samsung Galaxy A54', category='ELECTRONICS',
                 description='6.4-inch Super AMOLED display, 50MP camera, 5000mAh battery. 128GB storage.',
                 brand='Samsung', unit='piece',
                 tags='phone,smartphone,samsung,android,mobile'),
            dict(name='iPhone 14', category='ELECTRONICS',
                 description='Apple iPhone 14, 6.1-inch display, A15 Bionic chip, 12MP dual camera. 128GB.',
                 brand='Apple', unit='piece',
                 tags='phone,iphone,apple,smartphone,ios,mobile'),
            dict(name='Tecno Spark 10', category='ELECTRONICS',
                 description='6.6-inch display, 16MP front camera, 5000mAh battery. Popular budget smartphone.',
                 brand='Tecno', unit='piece',
                 tags='phone,smartphone,tecno,android,budget,mobile'),
            dict(name='Infinix Hot 30', category='ELECTRONICS',
                 description='6.78-inch display, 50MP camera, 5000mAh battery. Affordable Android phone.',
                 brand='Infinix', unit='piece',
                 tags='phone,smartphone,infinix,android,budget,mobile'),
            dict(name='HP Laptop 15', category='ELECTRONICS',
                 description='Intel Core i5, 8GB RAM, 512GB SSD, 15.6-inch FHD display. Windows 11.',
                 brand='HP', unit='piece',
                 tags='laptop,computer,hp,intel,windows,notebook'),
            dict(name='Lenovo IdeaPad 3', category='ELECTRONICS',
                 description='AMD Ryzen 5, 8GB RAM, 256GB SSD, 15.6-inch display. Lightweight and fast.',
                 brand='Lenovo', unit='piece',
                 tags='laptop,computer,lenovo,amd,windows,notebook'),
            dict(name='Samsung 43-inch Smart TV', category='ELECTRONICS',
                 description='4K UHD Smart TV, HDR, built-in WiFi, Netflix and YouTube ready.',
                 brand='Samsung', unit='piece',
                 tags='tv,television,smart tv,samsung,4k,uhd'),
            dict(name='LG 32-inch LED TV', category='ELECTRONICS',
                 description='Full HD LED TV, USB and HDMI ports, energy efficient.',
                 brand='LG', unit='piece',
                 tags='tv,television,lg,led,full hd'),
            dict(name='USB-C Phone Charger 65W', category='ELECTRONICS',
                 description='Fast charging 65W USB-C charger compatible with most smartphones and laptops.',
                 brand='Anker', unit='piece',
                 tags='charger,usb-c,fast charge,phone charger,cable'),
            dict(name='Wireless Bluetooth Earbuds', category='ELECTRONICS',
                 description='True wireless earbuds, 24hr battery life, noise cancellation, IPX5 waterproof.',
                 brand='JBL', unit='piece',
                 tags='earbuds,bluetooth,wireless,headphones,jbl,audio'),
            dict(name='Phone Screen Protector', category='ELECTRONICS',
                 description='Tempered glass screen protector, 9H hardness, anti-scratch, universal fit.',
                 brand='Generic', unit='piece',
                 tags='screen protector,tempered glass,phone accessory'),
            dict(name='Power Bank 20000mAh', category='ELECTRONICS',
                 description='20000mAh portable charger, dual USB output, fast charging support.',
                 brand='Romoss', unit='piece',
                 tags='power bank,portable charger,battery,romoss'),

            # --- FOOD & GROCERIES ---
            dict(name='Teff Flour (1kg)', category='FOOD',
                 description='Premium white teff flour, stone-ground, ideal for injera. Locally sourced.',
                 brand='Mama\'s Kitchen', unit='kg',
                 tags='teff,flour,injera,ethiopian food,grain'),
            dict(name='Berbere Spice Mix (200g)', category='FOOD',
                 description='Traditional Ethiopian berbere spice blend. Perfect for wot and stews.',
                 brand='Abyssinia Spices', unit='pack',
                 tags='berbere,spice,ethiopian,wot,cooking'),
            dict(name='Ethiopian Coffee Beans (500g)', category='FOOD',
                 description='Single origin Yirgacheffe coffee beans, medium roast, rich aroma.',
                 brand='Yirgacheffe Coffee', unit='pack',
                 tags='coffee,ethiopian coffee,yirgacheffe,beans,arabica'),
            dict(name='Sunflower Cooking Oil (5L)', category='FOOD',
                 description='Pure refined sunflower oil, cholesterol free, ideal for frying and cooking.',
                 brand='Nile', unit='bottle',
                 tags='cooking oil,sunflower oil,oil,nile'),
            dict(name='Pasta (500g)', category='FOOD',
                 description='Durum wheat semolina pasta, spaghetti style. Quick cooking.',
                 brand='Adama Pasta', unit='pack',
                 tags='pasta,spaghetti,wheat,food'),
            dict(name='Rice (5kg)', category='FOOD',
                 description='Long grain white rice, premium quality, imported.',
                 brand='Uncle Ben\'s', unit='bag',
                 tags='rice,grain,food,white rice'),
            dict(name='Tomato Paste (400g)', category='FOOD',
                 description='Concentrated tomato paste, no preservatives, rich flavor.',
                 brand='Heinz', unit='can',
                 tags='tomato,paste,sauce,cooking'),
            dict(name='Sugar (1kg)', category='FOOD',
                 description='Refined white sugar, fine grain.',
                 brand='Wonji Sugar', unit='kg',
                 tags='sugar,sweetener,wonji'),

            # --- CLOTHING ---
            dict(name='Men\'s Formal Shirt', category='CLOTHING',
                 description='100% cotton formal shirt, available in white, blue and grey. Sizes S-XXL.',
                 brand='Addis Fashion', unit='piece',
                 tags='shirt,formal,men,cotton,clothing'),
            dict(name='Women\'s Habesha Kemis', category='CLOTHING',
                 description='Traditional Ethiopian dress, hand-woven cotton, beautiful embroidery.',
                 brand='Habesha Designs', unit='piece',
                 tags='habesha,kemis,dress,traditional,ethiopian,women'),
            dict(name='Jeans Trouser (Men)', category='CLOTHING',
                 description='Slim fit denim jeans, stretch fabric, available in blue and black. Sizes 28-38.',
                 brand='Levi\'s', unit='piece',
                 tags='jeans,denim,men,trouser,pants'),
            dict(name='Running Shoes', category='CLOTHING',
                 description='Lightweight running shoes, breathable mesh, cushioned sole. Sizes 38-46.',
                 brand='Nike', unit='pair',
                 tags='shoes,running,nike,sports,footwear'),
            dict(name='Leather Sandals', category='CLOTHING',
                 description='Handmade Ethiopian leather sandals, durable and comfortable.',
                 brand='Lalibela Leather', unit='pair',
                 tags='sandals,leather,shoes,ethiopian,handmade'),

            # --- HOUSEHOLD ---
            dict(name='Electric Kettle 1.8L', category='HOUSEHOLD',
                 description='Stainless steel electric kettle, 1500W, auto shut-off, boil-dry protection.',
                 brand='Philips', unit='piece',
                 tags='kettle,electric,philips,kitchen,appliance'),
            dict(name='Non-stick Frying Pan 28cm', category='HOUSEHOLD',
                 description='Granite coated non-stick pan, induction compatible, heat-resistant handle.',
                 brand='Tefal', unit='piece',
                 tags='frying pan,non-stick,tefal,kitchen,cookware'),
            dict(name='Bed Sheet Set (King)', category='HOUSEHOLD',
                 description='100% cotton bed sheet set, king size, includes fitted sheet and 2 pillowcases.',
                 brand='Cotton Home', unit='set',
                 tags='bed sheet,cotton,bedding,king size,household'),
            dict(name='Plastic Storage Containers (Set of 5)', category='HOUSEHOLD',
                 description='Airtight food storage containers, BPA-free, microwave safe.',
                 brand='Lock & Lock', unit='set',
                 tags='storage,container,plastic,kitchen,food storage'),
            dict(name='Broom and Dustpan Set', category='HOUSEHOLD',
                 description='Ergonomic broom with dustpan, long handle, soft bristles.',
                 brand='Leifheit', unit='set',
                 tags='broom,dustpan,cleaning,household'),

            # --- HEALTH & BEAUTY ---
            dict(name='Paracetamol 500mg (20 tablets)', category='HEALTH',
                 description='Pain relief and fever reducer. 500mg paracetamol tablets.',
                 brand='Panadol', unit='pack',
                 tags='paracetamol,panadol,medicine,pain relief,fever'),
            dict(name='Vitamin C 1000mg (30 tablets)', category='HEALTH',
                 description='Immune support vitamin C supplement, 1000mg per tablet.',
                 brand='Centrum', unit='pack',
                 tags='vitamin c,supplement,immune,health,centrum'),
            dict(name='Sunscreen SPF 50 (100ml)', category='HEALTH',
                 description='Broad spectrum SPF 50 sunscreen, water resistant, non-greasy.',
                 brand='Nivea', unit='bottle',
                 tags='sunscreen,spf,nivea,skin care,beauty'),
            dict(name='Shampoo 400ml', category='HEALTH',
                 description='Moisturizing shampoo for all hair types, paraben-free.',
                 brand='Head & Shoulders', unit='bottle',
                 tags='shampoo,hair care,head and shoulders,beauty'),
            dict(name='Hand Sanitizer 500ml', category='HEALTH',
                 description='70% alcohol hand sanitizer gel, kills 99.9% of germs.',
                 brand='Dettol', unit='bottle',
                 tags='sanitizer,hand sanitizer,dettol,hygiene,health'),

            # --- SPORTS ---
            dict(name='Football (Size 5)', category='SPORTS',
                 description='FIFA approved size 5 football, durable PU leather, suitable for all surfaces.',
                 brand='Adidas', unit='piece',
                 tags='football,soccer,ball,adidas,sports'),
            dict(name='Yoga Mat', category='SPORTS',
                 description='6mm thick non-slip yoga mat, eco-friendly TPE material, carrying strap included.',
                 brand='Gaiam', unit='piece',
                 tags='yoga,mat,exercise,fitness,sports'),
            dict(name='Dumbbells Set (5kg x2)', category='SPORTS',
                 description='Rubber coated dumbbells, 5kg each, sold as a pair.',
                 brand='Decathlon', unit='pair',
                 tags='dumbbells,weights,gym,fitness,exercise'),
        ]

        created = []
        for data in products_data:
            product, _ = Product.objects.get_or_create(
                name=data['name'],
                defaults=data,
            )
            created.append(product)

        self.stdout.write(self.style.SUCCESS(f'   ✓ {len(created)} products'))
        return created

    # ------------------------------------------------------------------
    def create_shop_products(self, shops, products):
        from apps.products.models import ShopProduct, Product

        self.stdout.write('💰 Creating shop inventory & prices...')

        # Map product names to objects for easy lookup
        prod = {p.name: p for p in products}

        # Each shop carries different products at different prices
        # Format: (product_name, price_ETB, availability, stock_qty, notes)
        inventory = {
            # Merkato Electronics Hub
            shops[0]: [
                ('Samsung Galaxy A54',        Decimal('14500'), True,  8,  'Original, with warranty'),
                ('iPhone 14',                 Decimal('62000'), True,  3,  'Imported, sealed box'),
                ('Tecno Spark 10',            Decimal('7200'),  True,  15, 'Local warranty'),
                ('Infinix Hot 30',            Decimal('6800'),  True,  12, 'New arrival'),
                ('HP Laptop 15',              Decimal('38000'), True,  5,  'With bag and mouse'),
                ('Lenovo IdeaPad 3',          Decimal('35500'), True,  4,  'AMD version'),
                ('USB-C Phone Charger 65W',   Decimal('850'),   True,  30, 'Fast charge'),
                ('Wireless Bluetooth Earbuds',Decimal('2200'),  True,  20, 'JBL original'),
                ('Phone Screen Protector',    Decimal('120'),   True,  50, 'Fits most phones'),
                ('Power Bank 20000mAh',       Decimal('1800'),  True,  10, 'Romoss brand'),
                ('Samsung 43-inch Smart TV',  Decimal('28000'), True,  3,  'With remote and stand'),
                ('Football (Size 5)',          Decimal('950'),   True,  8,  'Adidas quality'),
            ],
            # Bole Tech Store
            shops[1]: [
                ('Samsung Galaxy A54',        Decimal('15200'), True,  5,  'Samsung authorized dealer'),
                ('iPhone 14',                 Decimal('65000'), True,  6,  'Apple authorized reseller'),
                ('Tecno Spark 10',            Decimal('7500'),  True,  10, 'With screen protector'),
                ('HP Laptop 15',              Decimal('39500'), True,  7,  'HP authorized dealer'),
                ('Lenovo IdeaPad 3',          Decimal('36000'), True,  6,  'Lenovo warranty'),
                ('LG 32-inch LED TV',         Decimal('18500'), True,  4,  'LG authorized'),
                ('Samsung 43-inch Smart TV',  Decimal('29500'), True,  5,  'Samsung authorized'),
                ('USB-C Phone Charger 65W',   Decimal('950'),   True,  25, 'Anker original'),
                ('Wireless Bluetooth Earbuds',Decimal('2500'),  True,  15, 'With charging case'),
                ('Power Bank 20000mAh',       Decimal('1950'),  True,  8,  'Fast charge version'),
                ('Phone Screen Protector',    Decimal('150'),   True,  40, 'Premium tempered glass'),
                ('Yoga Mat',                  Decimal('1200'),  True,  6,  'Imported'),
                ('Dumbbells Set (5kg x2)',    Decimal('2800'),  True,  4,  'Rubber coated'),
            ],
            # Piassa General Store
            shops[2]: [
                ('Men\'s Formal Shirt',                  Decimal('650'),   True,  20, 'Cotton, various colors'),
                ('Women\'s Habesha Kemis',               Decimal('1800'),  True,  15, 'Hand-woven'),
                ('Jeans Trouser (Men)',                   Decimal('1200'),  True,  18, 'Slim fit'),
                ('Running Shoes',                         Decimal('3200'),  True,  10, 'Nike original'),
                ('Leather Sandals',                       Decimal('450'),   True,  25, 'Ethiopian made'),
                ('Electric Kettle 1.8L',                  Decimal('1350'),  True,  8,  'Philips brand'),
                ('Non-stick Frying Pan 28cm',             Decimal('980'),   True,  12, 'Tefal'),
                ('Bed Sheet Set (King)',                   Decimal('1600'),  True,  10, '100% cotton'),
                ('Plastic Storage Containers (Set of 5)', Decimal('750'),   True,  15, 'BPA free'),
                ('Broom and Dustpan Set',                  Decimal('320'),   True,  20, 'Long handle'),
                ('Teff Flour (1kg)',                       Decimal('85'),    True,  50, 'White teff'),
                ('Berbere Spice Mix (200g)',               Decimal('65'),    True,  40, 'Traditional blend'),
                ('Ethiopian Coffee Beans (500g)',          Decimal('320'),   True,  30, 'Yirgacheffe'),
                ('Sugar (1kg)',                            Decimal('55'),    True,  60, 'Wonji brand'),
            ],
            # CMC Health & Beauty
            shops[3]: [
                ('Paracetamol 500mg (20 tablets)', Decimal('35'),   True,  100, 'Panadol brand'),
                ('Vitamin C 1000mg (30 tablets)',  Decimal('280'),  True,  50,  'Centrum'),
                ('Sunscreen SPF 50 (100ml)',       Decimal('420'),  True,  30,  'Nivea'),
                ('Shampoo 400ml',                  Decimal('185'),  True,  40,  'Head & Shoulders'),
                ('Hand Sanitizer 500ml',           Decimal('120'),  True,  60,  'Dettol'),
                ('Men\'s Formal Shirt',            Decimal('700'),  True,  15,  'Various sizes'),
                ('Women\'s Habesha Kemis',         Decimal('2200'), True,  8,   'Premium quality'),
                ('Running Shoes',                  Decimal('3500'), True,  6,   'Nike & Adidas'),
                ('Yoga Mat',                       Decimal('1100'), True,  10,  'Non-slip'),
                ('Football (Size 5)',              Decimal('1100'), True,  5,   'Adidas'),
                ('Dumbbells Set (5kg x2)',         Decimal('2600'), True,  6,   'Decathlon'),
            ],
            # Kazanchis Food Market
            shops[4]: [
                ('Teff Flour (1kg)',                Decimal('80'),   True,  100, 'Fresh ground'),
                ('Berbere Spice Mix (200g)',         Decimal('60'),   True,  80,  'Homemade blend'),
                ('Ethiopian Coffee Beans (500g)',    Decimal('300'),  True,  60,  'Direct from farm'),
                ('Sunflower Cooking Oil (5L)',       Decimal('680'),  True,  40,  'Nile brand'),
                ('Pasta (500g)',                     Decimal('45'),   True,  120, 'Adama pasta'),
                ('Rice (5kg)',                       Decimal('380'),  True,  50,  'Long grain'),
                ('Tomato Paste (400g)',              Decimal('75'),   True,  90,  'Heinz'),
                ('Sugar (1kg)',                      Decimal('50'),   True,  150, 'Wonji'),
                ('Paracetamol 500mg (20 tablets)',   Decimal('30'),   True,  80,  'Generic brand'),
                ('Hand Sanitizer 500ml',             Decimal('110'),  True,  50,  'Dettol'),
                ('Shampoo 400ml',                    Decimal('175'),  True,  35,  'Various brands'),
                ('Plastic Storage Containers (Set of 5)', Decimal('700'), True, 20, 'Kitchen use'),
                ('Broom and Dustpan Set',            Decimal('300'),  True,  15,  'Local brand'),
            ],
        }

        count = 0
        for shop, items in inventory.items():
            for (product_name, price, availability, stock, notes) in items:
                product = prod.get(product_name)
                if not product:
                    continue
                ShopProduct.objects.get_or_create(
                    shop=shop,
                    product=product,
                    defaults=dict(
                        price=price,
                        availability=availability,
                        stock_quantity=stock,
                        notes=notes,
                    ),
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f'   ✓ {count} shop-product entries'))

    # ------------------------------------------------------------------
    def create_reviews(self, users_by_role, shops):
        from apps.reviews.models import Review

        self.stdout.write('⭐ Creating reviews...')

        customers = users_by_role.get('CUSTOMER', [])
        if not customers:
            from apps.users.models import User
            customers = list(User.objects.filter(role='CUSTOMER'))

        if not customers:
            self.stdout.write(self.style.WARNING('   No customers found, skipping reviews.'))
            return

        reviews_data = [
            # Merkato Electronics Hub
            (shops[0], customers[0], 5, 'Great selection of phones! Got my Samsung here at a good price. Staff was helpful.'),
            (shops[0], customers[1], 4, 'Good shop, prices are fair. A bit crowded but worth it.'),
            # Bole Tech Store
            (shops[1], customers[0], 5, 'Best electronics shop in Bole. Authorized dealer so you get genuine products.'),
            (shops[1], customers[2 % len(customers)], 4, 'Slightly expensive but quality is guaranteed. Good after-sales service.'),
            # Piassa General Store
            (shops[2], customers[1], 4, 'Good variety of household items. The habesha kemis selection is excellent!'),
            (shops[2], customers[0], 4, 'Reliable shop, been coming here for years. Fair prices.'),
            # CMC Health & Beauty
            (shops[3], customers[2 % len(customers)], 5, 'Clean shop, well organized. All health products are genuine.'),
            (shops[3], customers[1], 4, 'Good prices on vitamins and supplements. Friendly staff.'),
            # Kazanchis Food Market
            (shops[4], customers[0], 5, 'Freshest teff flour in Addis! The coffee beans are amazing too.'),
            (shops[4], customers[2 % len(customers)], 4, 'Great food market. Prices are competitive and quality is good.'),
            (shops[4], customers[1], 5, 'Best berbere spice in the city. My family loves it!'),
        ]

        count = 0
        for (shop, user, rating, comment) in reviews_data:
            _, made = Review.objects.get_or_create(
                shop=shop,
                user=user,
                defaults=dict(rating=rating, comment=comment),
            )
            if made:
                count += 1

        # Update shop ratings
        for shop in shops:
            shop.update_rating()

        self.stdout.write(self.style.SUCCESS(f'   ✓ {count} reviews'))
