# Smart Local Product Finder & Price Intelligence System

A full-stack web application for finding and comparing product prices across local shops in Ethiopia. Built with Django REST Framework (backend) and React (frontend).

---

## Features

- **Smart Search** — Full-text search with autocomplete suggestions, prefix matching, and category-based related products
- **Price Comparison** — Weighted scoring algorithm comparing price (40%), distance (35%), and availability (25%)
- **Location Awareness** — Haversine-formula distance calculation, nearby shops, and interactive Leaflet maps
- **Role-Based Access** — Customer, Shop Owner, and Admin roles with JWT authentication
- **Shop Management** — Shop owners list products with prices and availability; admin approval workflow
- **Reviews & Ratings** — 1–5 star ratings with comments; shop ratings auto-updated
- **Notifications** — In-app notifications for price drops, back-in-stock, new shops, and more
- **Analytics** — Search logs, product views, trending products, and admin dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework 3.14 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL |
| Cache | Redis (django-redis) |
| Task Queue | Celery |
| Maps | Leaflet + OpenStreetMap |
| Frontend | React 18, React Router 6, Tailwind CSS |
| API Docs | drf-spectacular (Swagger/ReDoc) |

---

## Project Structure

```
smart_finder/
├── manage.py
├── requirements.txt
├── .env.example
├── smart_finder/          # Django project config
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/             # Custom user model, JWT auth, roles
│   ├── shops/             # Shop CRUD, approval, nearby search
│   ├── products/          # Product catalog, shop inventory
│   ├── search/            # Smart search engine, suggestions
│   ├── comparison/        # Price + distance comparison engine
│   ├── reviews/           # Shop ratings and reviews
│   ├── notifications/     # In-app notification system
│   └── analytics/         # Search logs, product views, dashboards
└── frontend/              # React application
    ├── src/
    │   ├── api/           # Axios client with JWT interceptors
    │   ├── context/       # Auth context
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   └── styles/        # Tailwind CSS
    └── public/
```

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+

---

### Backend Setup

#### 1. Create and activate a virtual environment

```bash
cd smart_finder
python -m venv venv
source venv/bin/activate        # Linux/macOS
venv\Scripts\activate           # Windows
```

#### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

#### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
SECRET_KEY=your-very-secret-key-here
DEBUG=True
DB_NAME=smart_finder_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/0
GOOGLE_MAPS_API_KEY=your-google-maps-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### 4. Create the PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE smart_finder_db;
\q
```

#### 5. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### 6. Create a superuser (admin)

```bash
python manage.py createsuperuser
```

When prompted, set the role to ADMIN via the Django admin panel after creation.

#### 7. Start the development server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/v1/`

#### 8. Start Celery worker (optional, for async tasks)

```bash
celery -A smart_finder worker --loglevel=info
```

---

### Frontend Setup

#### 1. Install Node dependencies

```bash
cd frontend
npm install
```

#### 2. Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

Add to `tailwind.config.js`:

```js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

#### 3. Start the React development server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

---

## API Documentation

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

---

## Key API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register/` | Register new user |
| POST | `/api/v1/users/login/` | Login, returns JWT tokens |
| POST | `/api/v1/users/logout/` | Blacklist refresh token |
| GET/PATCH | `/api/v1/users/profile/` | Get/update own profile |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search/?q=rice` | Smart search |
| GET | `/api/v1/search/suggestions/?q=ri` | Autocomplete suggestions |
| GET | `/api/v1/search/trending/` | Trending searches and products |

### Comparison
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/compare/product/{id}/?lat=9.02&lon=38.75` | Compare shops for a product |
| GET | `/api/v1/compare/products/?ids=1,2,3` | Compare multiple products |

### Shops
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/shops/` | List approved shops |
| POST | `/api/v1/shops/create/` | Create shop (shop owner) |
| GET | `/api/v1/shops/nearby/?lat=9.02&lon=38.75&radius=5` | Nearby shops |
| PATCH | `/api/v1/shops/admin/{id}/approve/` | Approve/reject shop (admin) |

---

## Comparison Scoring Algorithm

The comparison engine ranks shops using a weighted score:

```
price_score      = (max_price - price) / (max_price - min_price) × 100
distance_score   = (max_dist - distance) / (max_dist - min_dist) × 100
availability_score = 100 if in_stock else 0

final_score = (price_score × 0.40) + (distance_score × 0.35) + (availability_score × 0.25)
```

Results are labeled:
- **Best Choice** — highest final score
- **Cheapest** — lowest price
- **Nearest** — shortest distance

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **CUSTOMER** | Search, compare, review shops, manage notifications |
| **SHOP_OWNER** | Create/manage shops, manage product inventory, view analytics |
| **ADMIN** | Approve shops, manage all users, view full analytics |

---

## Development Notes

- All prices are in **Ethiopian Birr (ETB)**
- Default city is **Addis Ababa**
- Maps use **OpenStreetMap** (no API key required)
- Distance calculations use the **Haversine formula**
- Search results are cached in Redis for 5 minutes
- JWT access tokens expire in **1 hour**, refresh tokens in **7 days**

---

## License

MIT License — free to use and modify for your projects.
