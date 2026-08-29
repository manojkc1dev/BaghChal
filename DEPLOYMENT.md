# 🚀 DEPLOYMENT GUIDE — BHEEDCHAAL (BAGH-CHAL)

This guide documents how to deploy **BheedChaal** to production using PostgreSQL, Redis, Django Channels (Daphne ASGI), and Vite.

---

## 1. Prerequisites & Infrastructure Requirements

- **Server Architecture**: Linux (Ubuntu 22.04 LTS or Debian 12 recommended)
- **Container Runtime**: Docker & Docker Compose v2+
- **Database**: PostgreSQL 15+
- **In-Memory Cache**: Redis 7+
- **Reverse Proxy**: Nginx or Traefik with TLS (Let's Encrypt Certbot)
- **Domain Names**:
  - Web App: `app.bheedchaal.com` (or your domain)
  - API / WebSocket: `api.bheedchaal.com`

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` on your production host:

```bash
cp .env.example .env
```

### Essential Production Settings:

```ini
DEBUG=False
SECRET_KEY=generate-a-strong-random-50-character-secret
ALLOWED_HOSTS=api.bheedchaal.com,app.bheedchaal.com
CORS_ALLOWED_ORIGINS=https://app.bheedchaal.com
CSRF_TRUSTED_ORIGINS=https://app.bheedchaal.com,https://api.bheedchaal.com

# PostgreSQL Connection
DATABASE_URL=postgres://bheedchaal_user:SECURE_DB_PASSWORD@postgres:5432/bheedchaal

# Redis Connection
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 3. Docker Compose Production Deployment

Launch all services (PostgreSQL, Redis, Daphne Web ASGI) in detached mode:

```bash
# Build and run container stack
docker-compose up -d --build
```

### Verify Container Status & Health:

```bash
docker-compose ps
```

The stack includes automated health checks:
- **Web Service**: `http://localhost:8000/health/` (Returns HTTP 200 `{"status": "ok"}`)
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

---

## 4. Manual / Virtualenv Django Deployment (Alternative)

If deploying directly on a Virtual Private Server (VPS) without Docker:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static assets
python manage.py collectstatic --noinput

# Start Daphne ASGI Server
daphne -b 0.0.0.0 -p 8000 core.asgi:application
```

---

## 5. Nginx Reverse Proxy Configuration (HTTPS & WSS)

Create `/etc/nginx/sites-available/bheedchaal.conf`:

```nginx
server {
    listen 80;
    server_name api.bheedchaal.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.bheedchaal.com;

    ssl_certificate /etc/letsencrypt/live/api.bheedchaal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.bheedchaal.com/privkey.pem;

    # REST API & Health Check
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # WebSocket Upgrade (WSS)
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 6. Frontend Build & Deployment

Set production environment variables before bundling:

```bash
cd frontend

# Set production API & WebSocket endpoints
export VITE_API_URL="https://api.bheedchaal.com"
export VITE_WS_URL="wss://api.bheedchaal.com"

# Build static bundle
npm run build
```

Deploy the output folder (`frontend/dist`) to your static hosting provider (Nginx / Vercel / Netlify / Cloudflare Pages).

---

## 7. Database Backups Strategy

For PostgreSQL production data safety:

### Daily Automated Backup (Cron):
```bash
0 3 * * * pg_dump -U bheedchaal_user -h localhost bheedchaal | gzip > /backups/bheedchaal_$(date +\%Y\%m\%d).sql.gz
```

### Restore Procedure:
```bash
gunzip -c /backups/bheedchaal_YYYYMMDD.sql.gz | psql -U bheedchaal_user -d bheedchaal
```

---

## 8. Verification & Post-Deployment Checklist

1. **Health Check**: `curl -f https://api.bheedchaal.com/health/`
2. **WebSocket WSS Connection**: Open browser dev console and verify `wss://api.bheedchaal.com/ws/game/room-1/` connects cleanly.
3. **Security Check**: Verify HTTP requests auto-redirect to HTTPS and cookies carry `Secure` and `SameSite` flags.
