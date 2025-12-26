# 🚀 VTGTOOL - Deployment Guide

## 📊 ARCHITECTURE

**2 Separate Servers:**

```
Production Server (DigitalOcean)
  ├─ Frontend (Docker)
  ├─ Backend (Docker)
  ├─ Redis (Docker)
  └─ Database: Managed PostgreSQL (DigitalOcean)

UAT Server (Current Development Server)
  ├─ Frontend (Docker)
  ├─ Backend (Docker)
  ├─ Redis (Docker)
  └─ Database: PostgreSQL (Docker Container)
```

---

## 🎯 SERVER ROLES

| Server | Domain | Purpose | Database |
|--------|--------|---------|----------|
| **Production** | vtgtool.help | Live users | Managed DB (DigitalOcean) |
| **UAT** | uat.vtgtool.help | Testing, Development | Local PostgreSQL Container |

---

## 🔧 UAT SERVER SETUP (Current Server)

### 1. Ensure UAT uses local database

```bash
cd /opt/vtgtool

# Run setup script
chmod +x scripts/setup-uat-db.sh
./scripts/setup-uat-db.sh
```

### 2. Verify UAT configuration

```bash
# Run verification
chmod +x scripts/verify-uat-separation.sh
./scripts/verify-uat-separation.sh
```

### 3. Start UAT

```bash
cd /opt/vtgtool
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d
```

### 4. Check UAT

```bash
docker ps
curl https://uat.vtgtool.help/health
curl https://uat.vtgtool.help/api/health
```

---

## 🚀 PRODUCTION SERVER SETUP

### 1. Provision server

- DigitalOcean Droplet: 2 vCPU, 2GB RAM, 20GB SSD
- Ubuntu 22.04 LTS
- Setup firewall: Allow 80, 443, 22

### 2. Install dependencies

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get update && apt-get install -y docker-compose-plugin

# Install Nginx (optional, for reverse proxy)
apt-get install -y nginx certbot
```

### 3. Create deployment directory

```bash
mkdir -p /opt/vtgtool
cd /opt/vtgtool
```

### 4. Copy deployment files

```bash
# From your local machine or git:
# - deploy/docker-compose.yml
# - deploy/.env.example
# - deploy/nginx/prod.conf
```

### 5. Configure environment

```bash
cd /opt/vtgtool
cp .env.example .env
nano .env
```

**Production .env:**
```bash
# Docker Registry
DOCKERHUB_USERNAME=your_dockerhub_username
IMAGE_TAG=latest

# Environment
ENVIRONMENT=production

# Ports
FRONTEND_PORT=80
FRONTEND_SSL_PORT=443

# Nginx Config
NGINX_CONFIG=prod.conf

# Database (DigitalOcean Managed)
DATABASE_URL=postgresql+asyncpg://doadmin:PASSWORD@db-cluster.ondigitalocean.com:25060/defaultdb?sslmode=require

# Security (Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your_production_secret_key_here
```

### 6. Setup SSL

```bash
# Get SSL certificate
certbot certonly --standalone -d vtgtool.help -d www.vtgtool.help

# Auto-renewal
certbot renew --dry-run
```

### 7. Start Production

```bash
cd /opt/vtgtool
docker compose pull
docker compose up -d
```

### 8. Verify Production

```bash
docker ps
curl https://vtgtool.help/health
curl https://vtgtool.help/api/health
```

---

## 🔄 DEPLOYMENT WORKFLOW

### Update UAT (from uat branch)

```bash
# On UAT server
cd /opt/vtgtool
git pull origin uat
docker compose -f docker-compose.yml -f docker-compose.uat.yml pull
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d --no-deps backend frontend
```

### Update Production (from main branch)

```bash
# On Production server
cd /opt/vtgtool
docker compose pull
docker compose up -d --no-deps backend frontend
```

---

## 🔍 MONITORING

### Check UAT

```bash
# On UAT server
docker ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Check Production

```bash
# On Production server
docker ps
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 🗄️ DATABASE MANAGEMENT

### UAT Database (Local Container)

```bash
# Backup
docker exec vtg-db-uat pg_dump -U vtg_uat vtgtool_uat > uat_backup_$(date +%Y%m%d).sql

# Restore
cat uat_backup.sql | docker exec -i vtg-db-uat psql -U vtg_uat vtgtool_uat

# Access psql
docker exec -it vtg-db-uat psql -U vtg_uat vtgtool_uat

# Reset database
docker exec vtg-db-uat psql -U vtg_uat vtgtool_uat -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec vtg-backend python init_db.py
```

### Production Database (Managed)

```bash
# Backup (from Production server)
pg_dump "$DATABASE_URL" > prod_backup_$(date +%Y%m%d).sql

# Restore
psql "$DATABASE_URL" < prod_backup.sql
```

---

## 🔐 SECURITY CHECKLIST

### UAT
- [x] Uses local PostgreSQL container (not Production DB)
- [x] Separate SECRET_KEY from Production
- [x] Rate limiting enabled
- [x] CORS configured
- [x] Input validation enabled

### Production
- [x] Uses managed database with SSL
- [x] Strong SECRET_KEY (32+ chars)
- [x] SSL/HTTPS enabled
- [x] Rate limiting enabled
- [x] CORS restricted to production domain
- [x] Security headers enabled
- [x] Regular backups

---

## 🆘 TROUBLESHOOTING

### UAT Issues

```bash
# Check logs
docker compose logs backend

# Restart services
docker compose -f docker-compose.yml -f docker-compose.uat.yml restart

# Full restart
docker compose -f docker-compose.yml -f docker-compose.uat.yml down
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d
```

### Production Issues

```bash
# Check logs
docker compose logs backend

# Restart services
docker compose restart

# Full restart
docker compose down
docker compose up -d
```

---

## 📞 QUICK REFERENCE

### UAT Commands
```bash
# Start
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d

# Stop
docker compose -f docker-compose.yml -f docker-compose.uat.yml down

# Logs
docker compose logs -f

# Update
docker compose -f docker-compose.yml -f docker-compose.uat.yml pull
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d
```

### Production Commands
```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Update
docker compose pull
docker compose up -d
```

---

## 📚 RELATED DOCS

- `UAT_DATABASE_SEPARATION_GUIDE.md` - Detailed UAT database setup
- `SECURITY_FIXES_SUMMARY.md` - Security improvements
- `deploy/README.md` - Deployment details
- `scripts/README.md` - Scripts documentation

---

**Status:** ✅ Ready for Production  
**Last Updated:** 2025-12-25

