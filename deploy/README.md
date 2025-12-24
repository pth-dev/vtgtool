# 🚀 VTG Tool - Deployment Guide

## 📋 Overview

This folder contains everything needed to deploy VTG Tool on a production/UAT server.
**No source code cloning required** - only Docker images from registry.

## 📁 Structure

```
deploy/
├── docker-compose.yml      # Main deployment file (uses images from registry)
├── docker-compose.uat.yml  # UAT override (adds local PostgreSQL)
├── .env.example            # Environment template
├── nginx/
│   ├── prod.conf           # Production nginx config (vtgtool.help)
│   └── uat.conf            # UAT nginx config (uat.vtgtool.help)
└── README.md               # This file
```

## 🛠️ Server Setup

### 1. Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get update && apt-get install -y docker-compose-plugin
```

### 2. Create deployment directory

```bash
mkdir -p /opt/vtgtool
cd /opt/vtgtool
```

### 3. Copy files to server

```bash
# From your local machine:
scp -r deploy/* root@your-server:/opt/vtgtool/
```

### 4. Configure environment

```bash
cd /opt/vtgtool
cp .env.example .env
nano .env  # Edit with your values
```

### 5. Setup SSL (Let's Encrypt)

```bash
# Install certbot
apt-get install -y certbot

# Get certificates
certbot certonly --standalone -d vtgtool.help -d www.vtgtool.help

# For UAT:
certbot certonly --standalone -d uat.vtgtool.help
```

## 🚀 Deployment Commands

### Production

```bash
cd /opt/vtgtool

# Pull latest images
docker compose pull

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down
```

### UAT (with local PostgreSQL)

```bash
cd /opt/vtgtool

# Start with UAT override
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d

# Or create alias in .bashrc:
alias uat-up="docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d"
```

## 🔄 Update Deployment

When CI/CD pushes new images:

```bash
cd /opt/vtgtool

# Pull new images
docker compose pull

# Restart with new images (zero-downtime)
docker compose up -d --no-deps backend frontend

# Or full restart
docker compose down && docker compose up -d
```

## 🔧 Rollback

```bash
# Edit .env to use previous image tag
nano .env
# Change: IMAGE_TAG=abc123 (previous commit SHA)

# Restart
docker compose up -d
```

## 📊 Monitoring

```bash
# View all containers
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Check health
curl http://localhost/health
curl http://localhost/api/health
```

## 🔐 Security Checklist
nge SECRET_KEY in .env                                                                                                                                                          
- [ ] Setup SSL certificates
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Restrict database access
- [ ] Enable Docker auto-updates

- [ ] Cha