# Smart Finder - Deployment Guide

This guide covers the critical integration work completed and provides step-by-step instructions for deploying the Smart Finder application to production.

## Completed Critical Integration Work

### 1. Component Integration ✅
- ✅ Integrated `ProductReviews` into `ProductDetailPage`
- ✅ Integrated `SocialShare` into `ProductDetailPage`
- ✅ Added `ThemeToggle` to navigation/header (already existed in Navbar)
- ✅ Added `LanguageSwitcher` to navigation/header (already existed in Navbar)
- ✅ Added `EmailPreferences` to user profile/settings page
- ✅ Added price alert buttons to product pages

### 2. Backend Configuration ✅
- ✅ Configured SMTP/email service in settings.py
- ✅ Replaced barcode scanner demo with actual library (html5-qrcode)
- ✅ Updated .env.example with email and security settings

### 3. Security & Production Settings ✅
- ✅ Set DEBUG to use environment variable
- ✅ Configured ALLOWED_HOSTS from environment variable
- ✅ Configured SECRET_KEY from environment variable
- ✅ Configured CORS for production domain
- ✅ Set up rate limiting (already configured in REST_FRAMEWORK)
- ✅ Configured secure headers (HSTS, SSL redirect, XSS protection)

## Pre-Deployment Checklist

### Backend (Django)

1. **Install Python Dependencies**
```bash
cd smart_finder
pip install -r requirements.txt
```

2. **Configure Environment Variables**
```bash
cp .env.example .env
# Edit .env with your production values
```

Required environment variables:
- `SECRET_KEY` - Generate a strong random key
- `DEBUG=False` - Set to False for production
- `ALLOWED_HOSTS` - Add your production domain
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Database configuration
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` - SMTP configuration
- `SECURE_SSL_REDIRECT=True` - Enable HTTPS redirect in production
- `CSRF_COOKIE_SECURE=True` - Enable secure cookies in production
- `SESSION_COOKIE_SECURE=True` - Enable secure session cookies in production

3. **Run Database Migrations**
```bash
python manage.py migrate
```

4. **Collect Static Files**
```bash
python manage.py collectstatic
```

5. **Create Superuser**
```bash
python manage.py createsuperuser
```

6. **Load Seed Data (Optional)**
```bash
python manage.py load_seed_data
```

### Frontend (React)

1. **Install Node Dependencies**
```bash
cd frontend
npm install
```

2. **Build for Production**
```bash
npm run build
```

3. **Install html5-qrcode library**
```bash
npm install html5-qrcode@^2.3.8
```

## Deployment Options

### Option 1: Traditional VPS/Server

#### Backend Deployment (Gunicorn + Nginx)

1. **Install Gunicorn**
```bash
pip install gunicorn
```

2. **Run Gunicorn**
```bash
gunicorn smart_finder.wsgi:application --bind 0.0.0.0:8000
```

3. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/smart_finder/staticfiles/;
    }

    location /media/ {
        alias /path/to/smart_finder/media/;
    }
}
```

#### Frontend Deployment (Serve with Nginx)

1. **Build the frontend**
```bash
cd frontend
npm run build
```

2. **Configure Nginx to serve React build**
```nginx
location / {
    root /path/to/frontend/build;
    try_files $uri $uri/ /index.html;
}
```

### Option 2: Docker Deployment

1. **Create Dockerfile for Backend**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "smart_finder.wsgi:application", "--bind", "0.0.0.0:8000"]
```

2. **Create Dockerfile for Frontend**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

3. **Create docker-compose.yml**
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: smart_finder_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./smart_finder
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - DB_HOST=db
      - DB_PORT=5432
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

4. **Run with Docker Compose**
```bash
docker-compose up -d
```

### Option 3: Cloud Platform (Heroku, Railway, Render)

#### Heroku Deployment

1. **Create Procfile**
```
web: gunicorn smart_finder.wsgi:application --bind 0.0.0.0:$PORT
```

2. **Install Heroku CLI**
```bash
npm install -g heroku
```

3. **Login and Create App**
```bash
heroku login
heroku create smart-finder-app
```

4. **Set Environment Variables**
```bash
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALLOWED_HOSTS=your-app.herokuapp.com
# Add other required variables
```

5. **Deploy**
```bash
git push heroku main
```

## Post-Deployment Steps

1. **Verify Database Connection**
```bash
python manage.py dbshell
```

2. **Test API Endpoints**
```bash
curl https://your-domain.com/api/v1/products/
```

3. **Check Email Configuration**
```bash
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test body', 'noreply@smartfinder.et', ['test@example.com'])
```

4. **Verify SSL Certificate**
- Ensure HTTPS is working
- Check SSL redirect is functioning
- Verify secure headers are set

5. **Monitor Logs**
```bash
# For Gunicorn
tail -f /var/log/gunicorn/error.log

# For Nginx
tail -f /var/log/nginx/error.log
```

## Security Considerations

1. **Firewall Configuration**
- Allow only necessary ports (80, 443, 22 for SSH)
- Block direct database access from outside

2. **Database Security**
- Use strong database passwords
- Enable SSL for database connections
- Regular database backups

3. **API Security**
- Rate limiting is configured in settings.py
- JWT tokens have expiration (1 hour access, 7 days refresh)
- CORS is restricted to specific origins

4. **File Upload Security**
- Validate file types and sizes
- Store uploads in non-public directory
- Use CDN for static assets in production

## Monitoring and Maintenance

1. **Set Up Error Tracking**
- Consider using Sentry for error monitoring
- Configure logging levels appropriately

2. **Performance Monitoring**
- Monitor database query performance
- Track API response times
- Set up uptime monitoring

3. **Regular Updates**
- Keep dependencies updated
- Apply security patches promptly
- Monitor Django and React security advisories

## Troubleshooting

### Common Issues

1. **Static Files Not Loading**
```bash
python manage.py collectstatic --clear --noinput
```

2. **Database Connection Errors**
- Verify database credentials
- Check if database server is running
- Ensure firewall allows connection

3. **Email Not Sending**
- Verify SMTP credentials
- Check if email provider requires app-specific password
- Test email configuration with Django shell

4. **CORS Errors**
- Add frontend domain to CORS_ALLOWED_ORIGINS
- Verify CORS_ALLOW_CREDENTIALS is set correctly

## Support

For issues or questions:
- Check Django logs: `/var/log/gunicorn/error.log`
- Check Nginx logs: `/var/log/nginx/error.log`
- Review API documentation: `/api/schema/`
