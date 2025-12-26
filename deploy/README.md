# 🚀 VTG Tool - Production Deployment Guide

## 📋 Overview

Deploy VTG Tool Production lên server riêng.

**UAT Server:** uat.vtgtool.help (139.59.237.190) - Đã setup sẵn
**Production Server:** vtgtool.help (cần setup)

## 📁 Structure

```
deploy/
├── docker-compose.yml      # Production deployment
├── deploy.sh               # Deploy script
├── .env.example            # Environment template
├── nginx/
│   ├── prod.conf           # Production nginx (vtgtool.help)
│   └── uat.conf            # UAT nginx (uat.vtgtool.help)
└── README.md               # This file
```

## 🛠️ Production Server Setup

### 1. SSH vào Production Server

```bash
ssh root@<production-server-ip>
```

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
apt-get update && apt-get install -y docker-compose certbot git
```

### 3. Clone Repository

```bash
git clone https://github.com/<org>/vtgtool.git /root/vtgtool
```

### 4. Setup Deployment Directory

```bash
mkdir -p /opt/vtgtool/nginx /opt/vtgtool/logs /opt/vtgtool/backups
cp /root/vtgtool/deploy/docker-compose.yml /opt/vtgtool/
cp /root/vtgtool/deploy/nginx/prod.conf /opt/vtgtool/nginx/
cp /root/vtgtool/deploy/deploy.sh /opt/vtgtool/
cp /root/vtgtool/deploy/.env.example /opt/vtgtool/.env
```

### 5. Configure Environment

```bash
cd /opt/vtgtool
nano .env  # Fill in DB_PASSWORD and SECRET_KEY
```

### 6. Build Images

```bash
cd /root/vtgtool/packages/backend
docker build -t vtgtool-be:prod .

cd /root/vtgtool/packages/frontend
docker build -t vtgtool-fe:prod .
```

### 7. Start Services (HTTP first)

```bash
cd /opt/vtgtool
docker-compose up -d
```

### 8. Setup SSL

```bash
# Start với HTTP để certbot verify
certbot certonly --webroot \
  -w /var/lib/docker/volumes/vtgtool_certbot-webroot/_data \
  -d vtgtool.help \
  --non-interactive --agree-tos --email admin@vtgtool.help

# Restart để apply SSL
docker-compose restart frontend
```

## 🚀 Deployment Commands

```bash
cd /opt/vtgtool

# Deploy (no rebuild)
./deploy.sh

# Rebuild images và deploy
./deploy.sh rebuild

# Backup DB trước khi deploy
./deploy.sh rebuild backup

# Manual commands
docker-compose up -d
docker-compose down
docker-compose logs -f backend
```

## 🔄 Update Code

```bash
# Pull latest code
cd /root/vtgtool
git pull origin main

# Rebuild và deploy
cd /opt/vtgtool
./deploy.sh rebuild
```

## 🔧 Rollback

```bash
# Checkout previous version
cd /root/vtgtool
git checkout <previous-commit>

# Rebuild
./deploy.sh rebuild
```

## 📊 Monitoring

```bash
# Container status
docker ps

# Logs
docker logs vtg-backend-prod -f
docker logs vtg-frontend-prod -f

# Health check
curl https://vtgtool.help/health
```

## 🔐 Security Checklist

- [ ] Change DB_PASSWORD in .env
- [ ] Change SECRET_KEY in .env
- [ ] Setup SSL certificates
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Setup automatic SSL renewal: `certbot renew --dry-run`