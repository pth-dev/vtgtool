# 🌊 VTG TOOL - DIGITALOCEAN DEPLOYMENT GUIDE

> Simple & Practical deployment cho dự án nội bộ <100 users

## 🎯 **YOUR USE CASE: Internal Project <100 Users**

```
┌─────────────────────────────────────────────┐
│  ✅ RECOMMENDED: 1 DROPLET                  │
│                                             │
│  Why?                                       │
│  - Internal project only                    │
│  - Under 100 users                          │
│  - Simple setup & maintenance               │
│  - Cost-effective ($18-24/month)            │
│  - Docker isolation = Safe enough           │
└─────────────────────────────────────────────┘
```

## 🏗️ ARCHITECTURE: SINGLE DROPLET

### **Option 1: 1 Droplet - Recommended for You ✅**

```
┌────────────────────────────────────────────────────┐
│         SINGLE DROPLET - vtgtool.internal          │
│         $12-18/month (simpler!)                    │
│         2GB RAM, 1 vCPU, 50GB SSD                  │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  UAT Environment (Docker)                │     │
│  │  → Main workspace for coding & testing   │     │
│  │  - Port: 8080 (Frontend), 8001 (Backend) │     │
│  │  - Git: uat branch                       │     │
│  │  - DB: PostgreSQL in Docker             │     │
│  │  - Domain: uat.vtgtool.help              │     │
│  │                                          │     │
│  │  Workflow:                               │     │
│  │  1. Checkout feature from uat            │     │
│  │  2. Code & test                          │     │
│  │  3. Merge back to uat                    │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  Production Environment (Docker)         │     │
│  │  - Port: 80/443 (Nginx + SSL)            │     │
│  │  - Git: main branch                      │     │
│  │  - DB: DigitalOcean Managed PostgreSQL  │     │
│  │        (separate droplet/service)        │     │
│  │  - Domain: vtgtool.help                  │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │  Shared Services (on droplet)            │     │
│  │  - Redis (2 instances: uat & prod)       │     │
│  │  - Nginx (reverse proxy)                 │     │
│  └──────────────────────────────────────────┘     │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  DigitalOcean Managed Database         │
│  (Optional - for Production only)      │
│  - PostgreSQL 15                       │
│  - Auto backups                        │
│  - High availability                   │
│  - $15/month                           │
└────────────────────────────────────────┘
```

**✅ Perfect for your use case:**
- ✅ **Super simple:** Only 2 environments (UAT + Prod)
- ✅ **Very cost-effective:** $12-18/month droplet only
- ✅ **UAT = Development:** Code directly on UAT, no separate dev
- ✅ **Docker isolation:** UAT & Prod separated via containers
- ✅ **Prod DB separate:** DigitalOcean Managed DB (optional)
- ✅ **Good enough:** <100 internal users, no high traffic
- ✅ **Easy maintenance:** One server, minimal complexity
- ✅ **Quick setup:** 30 minutes to deploy all

**✅ Safe enough because:**
- Docker containers provide isolation
- UAT for testing, Prod for users
- Separate databases (UAT in Docker, Prod managed)
- Separate Redis instances
- Internal project = lower security risk
- Can upgrade to managed DB anytime

---

### **Option 2: 2 Droplets - Only if you scale later**

```
┌──────────────────┐         ┌──────────────────┐
│  DEV/UAT Droplet │         │  Production Only │
│  $12/month       │         │  $24/month       │
└──────────────────┘         └──────────────────┘
```

**When to upgrade to 2 droplets:**
- Users grow >200 people
- External customers (not just internal)
- Production downtime unacceptable
- High traffic periods
- Budget allows ($36+/month)

**For now: Stick with 1 droplet!** ✅

---

## 🎯 **KHUYẾN NGHỊ: 1 DROPLET CHO DỰ ÁN NỘI BỘ**

### **Lý do:**

#### 1. **Simple is Better for Internal Projects**
```
Internal project <100 users:
- Setup time: 1 hour vs 2-3 hours (2 droplets)
- Maintenance: 1 server to monitor
- Cost: $18-24/month vs $36-48/month
- Complexity: Low vs Medium
→ Perfect fit!
```

#### 2. **Docker Isolation is Enough**
```
Docker containers provide:
- Process isolation
- Separate databases (dev/uat/prod)
- Independent Redis instances
- Network isolation via Nginx
- Easy to restart one without affecting others

→ Good enough for internal use!
```

#### 3. **Easy Growth Path:**
```
Month 1-6:   1 Droplet (internal, <100 users)
Month 6-12:  Upgrade droplet size if slow ($24→$48)
Year 2:      Split to 2 droplets if users >200
Year 3:      Add load balancer if needed

Start simple → Scale when needed
```

---

## 📦 **DIGITALOCEAN DROPLET SPECS**

### **Single Droplet - UAT + Production**
```yaml
Name: vtgtool-internal
Size: Basic - $12-18/month
  - 2 GB RAM (enough cho UAT + Prod)
  - 1 vCPU
  - 50 GB SSD
  - 2 TB transfer
Region: Singapore (SGP1) - closest to Vietnam
Image: Ubuntu 22.04 LTS
Backups: Optional ($2.40/month) - recommended sau 1-2 tháng
Monitoring: Enabled (free)

Services chạy trên server này:
  - UAT (Docker) - Port 8080/8001
  - Production (Docker) - Port 80/443
  - PostgreSQL (for UAT only, in Docker)
  - Redis (2 instances: UAT + Prod)
  - Nginx (reverse proxy + SSL)

Production Database:
  - Option 1: DigitalOcean Managed PostgreSQL ($15/month)
  - Option 2: Same Docker PostgreSQL (simpler, enough for <100 users)
```

### **Why 2GB RAM?**
```
Memory Usage Estimate (without dev):
- UAT Docker:                 ~600MB
- Production Docker:          ~600MB
- PostgreSQL (UAT only):      ~256MB
- Redis (2 instances):        ~200MB
- Ubuntu System:              ~300MB
─────────────────────────────────────
Total:                        ~1.95GB

With 2GB: Perfect fit! ✅
No development = Less RAM needed ✅

If slow later → Upgrade to 4GB ($24/month)
```

### **When to Upgrade?**
```yaml
# Upgrade droplet size ($12 → $24 for 4GB) when:
- Memory usage > 90% consistently
- Slow response times
- Users > 50 people active simultaneously

# Add Managed Database ($15/month) when:
- Database > 500MB
- Need automatic backups
- Need better performance
- Users > 100 people

# Split to 2 droplets ($12 + $24) when:
- Users > 200 people
- External customers (not internal only)
- Need high availability
```

---

## 🚀 **SETUP GUIDE - SINGLE DROPLET (Recommended)**

### **STEP 1: Tạo Droplet**

```bash
# 1. Create droplet trên DigitalOcean dashboard
Name: vtgtool-internal
Size: $18/month (4GB RAM, 2 vCPU)
Region: Singapore (SGP1)
Image: Ubuntu 22.04 LTS
Backups: Enable sau khi setup xong (optional)

# 2. SSH vào server
ssh root@your-droplet-ip

# 3. Initial setup
apt update && apt upgrade -y
apt install -y git docker.io docker-compose-plugin postgresql redis-server nginx python3 python3-pip tmux

# 4. Clone repository
cd /root
git clone https://github.com/your-org/vtgtool.git
# Or if using SSH:
# ssh-keygen -t ed25519 -C "your-email@example.com"
# cat ~/.ssh/id_ed25519.pub  # Add to GitHub
# git clone git@github.com:your-org/vtgtool.git

cd vtgtool

# 5. Setup Git config
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# 6. Setup ONLY UAT and Production environments
./setup-env.sh uat
./setup-env.sh production

# Each environment has separate:
# - .env files
# - SECRET_KEY  
# - Database (UAT in Docker, Prod can use Managed DB)
# - Redis instance

# 7. Configure DNS (if you have domain)
# Point to your droplet IP:
#   vtgtool.help → your-droplet-ip
#   uat.vtgtool.help → your-droplet-ip (same IP)
# 
# Wait 5-15 minutes for DNS propagation

# 8. Setup SSL (if using domain)
apt install certbot python3-certbot-nginx
certbot --nginx -d vtgtool.help -d www.vtgtool.help -d uat.vtgtool.help

# 9. Deploy UAT and Production
./deploy.sh uat
./deploy.sh production

# 10. Verify both environments
curl http://localhost:8080  # UAT frontend
curl http://localhost:8001/api/health  # UAT backend
curl http://localhost:80    # Production
curl https://uat.vtgtool.help/api/health  # If DNS configured
curl https://vtgtool.help/api/health
```

### **STEP 2: Configure Firewall**

```bash
# Basic firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https

# Allow UAT ports
ufw allow 8080/tcp comment 'UAT frontend'
ufw allow 8001/tcp comment 'UAT backend'

# Enable firewall
ufw enable
ufw status

# Note: Production (port 80/443) already allowed via http/https
```

---

## 🔐 **SECURITY SETUP**

### **Basic Security (Good enough for internal project)**

```bash
# 1. Disable password authentication
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
systemctl restart sshd

# 2. Setup fail2ban
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# 3. Setup automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# 4. Setup database backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U vtg_prod vtgtool_prod > $BACKUP_DIR/prod-$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "prod-*.sql" -mtime +7 -delete

# Upload to DigitalOcean Spaces (optional)
# s3cmd put $BACKUP_DIR/prod-$DATE.sql s3://your-bucket/backups/
```

```bash
chmod +x /root/backup-db.sh

# Setup cron job (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

---

## 📊 **DNS CONFIGURATION**

### **Point domains to your droplets:**

```
# At your DNS provider (Cloudflare, NameCheap, etc.)

A Record:
  uat.vtgtool.help     → dev-uat-droplet-ip
  vtgtool.help         → production-droplet-ip
  www.vtgtool.help     → production-droplet-ip (or CNAME to vtgtool.help)

# Wait 5-15 minutes for DNS propagation
# Test: ping uat.vtgtool.help
#       ping vtgtool.help
```

---

## 🔄 **SIMPLIFIED WORKFLOW (UAT = Development)**

### **Development & Testing (All on UAT):**
```bash
# SSH to server
ssh root@your-droplet-ip

cd /root/vtgtool

# Start from UAT branch
git checkout uat
git pull origin uat

# Create feature branch FROM UAT
git checkout -b feature/new-feature

# Code directly on server (use VS Code Remote SSH or vim/nano)
# Edit files: packages/backend/*, packages/frontend/*

# Test changes: Redeploy UAT with your changes
git add .
git commit -m "feat: new feature"
./deploy.sh uat

# Access UAT to test:
# https://uat.vtgtool.help (or http://your-ip:8080)
# https://uat.vtgtool.help/api/health

# If looks good, push feature branch
git push origin feature/new-feature

# Then merge back to UAT
git checkout uat
git merge feature/new-feature
git push origin uat
./deploy.sh uat  # Redeploy UAT with merged code

# Test thoroughly on UAT before production
```

### **Alternative: Quick fixes directly on UAT:**
```bash
# For small changes, commit directly to UAT
cd /root/vtgtool
git checkout uat

# Make changes
vim packages/backend/app/api/something.py

# Commit and deploy
git add .
git commit -m "fix: quick fix"
git push origin uat
./deploy.sh uat

# Test immediately on UAT
curl https://uat.vtgtool.help/api/health
```

### **Deploy to Production:**
```bash
# After testing well on UAT, merge to main
# Do this on GitHub: Create PR from uat → main

# On server:
cd /root/vtgtool
git checkout main
git pull origin main  # Pull the merged code

# Deploy Production (Docker)
./deploy.sh production

# Verify production
curl https://vtgtool.help/api/health
curl https://vtgtool.help  # Check website

# Monitor logs
docker-compose -f infra/docker-compose.yml logs -f
```

### **Managing Both Environments:**
```bash
# Check what's running
docker ps

# View logs
docker-compose logs -f  # UAT
docker-compose -f infra/docker-compose.yml logs -f  # Production

# Restart specific environment
./deploy.sh uat         # Restart UAT only
./deploy.sh production  # Restart Production only

# Check current branch
git branch

# Switch between environments
git checkout uat   # To work on UAT
git checkout main  # To deploy Production
```

---

## 💰 **COST BREAKDOWN**

### **Single Droplet - Perfect for Your Use Case ✅**
```
Droplet (2GB RAM):      $12-18/month
Backups (optional):     $2.40/month (sau 1-2 tháng)
─────────────────────────────────
TOTAL:                  $12-20/month ≈ $144-240/year

Benefits:
✅ Super simple: Only UAT + Prod
✅ Very cost-effective
✅ UAT = Development (no separate dev)
✅ Docker isolation = Safe enough
✅ Easy to manage (1 server)
✅ Perfect cho <100 users
✅ Dễ upgrade sau nếu cần
```

### **Optional: Add Managed Database for Production**
```
Droplet (2GB RAM):           $12-18/month
Managed PostgreSQL:          $15/month
Backups (droplet):           $2.40/month
─────────────────────────────────────────
TOTAL:                       $29-35/month

Upgrade to Managed DB when:
✅ Production database > 500MB
✅ Need automatic backups
✅ Need better performance
✅ Users > 100 people
```

### **If You Scale Later: 2 Droplets**
```
UAT Droplet:            $12/month
Production Droplet:     $24/month
Managed DB:             $15/month
Backups:                $3.60/month
─────────────────────────────────
TOTAL:                  $54.60/month ≈ $655/year

Upgrade when:
- Users > 200 people
- External customers
- High traffic
- Need high availability
```

**For now: 1 droplet saves $40+/month và đơn giản hơn RẤT NHIỀU!**

---

## 📈 **MONITORING & ALERTS**

### **DigitalOcean Monitoring (Free)**

```bash
# Enable on your droplet
# Dashboard → Droplet → Monitoring

Monitor:
- CPU usage (should be <50% normally)
- Memory usage (should be <3.5GB/4GB)
- Disk I/O
- Network traffic
- Disk usage (alert when >70%)

Setup alerts:
- CPU > 80% for 10 minutes
- Memory > 90% for 5 minutes  
- Disk > 75%

# If these alerts fire consistently → time to upgrade droplet size
```

### **Application Monitoring (Optional)**

```bash
# Add Sentry for error tracking
# Add Uptime Robot for uptime monitoring
# Add Google Analytics for user tracking
```

---

## ✅ **FINAL RECOMMENDATION FOR YOUR PROJECT**

```
┌────────────────────────────────────────────┐
│  ✅ GO WITH 1 DROPLET                      │
│                                            │
│  Perfect for your use case:                │
│  - Internal project only                   │
│  - Under 100 users                         │
│  - Simple setup priority                   │
│  - Cost-effective ($18-24/month)           │
│  - Docker isolation = Safe enough          │
│                                            │
│  Upgrade to 2 droplets when:               │
│  - Users > 200 people                      │
│  - External customers (not internal)       │
│  - High traffic                            │
│  - Can't afford any downtime               │
│  - Budget allows ($40+/month)              │
│                                            │
│  For now: KISS (Keep It Simple, Stupid!)   │
│  → 1 droplet là đủ! ✅                     │
└────────────────────────────────────────────┘
```

---

## 🚀 **NEXT STEPS**

```bash
# 1. Create 1 droplet on DigitalOcean
#    Name: vtgtool-internal
#    Size: $18-24/month (4GB RAM, 2 vCPU)
#    Region: Singapore
#    Image: Ubuntu 22.04

# 2. SSH to server and run setup
ssh root@your-droplet-ip
apt update && apt upgrade -y
apt install -y git docker.io docker-compose-plugin nginx tmux
cd /root
git clone https://github.com/your-org/vtgtool.git
cd vtgtool

# 3. Setup UAT and Production only
./setup-env.sh uat  
./setup-env.sh production
# No dev environment needed - UAT is your dev!

# 4. Configure DNS (optional, if you have domain)
#    uat.vtgtool.help → your-droplet-ip
#    vtgtool.help → your-droplet-ip

# 5. Setup SSL (if using domain)
apt install certbot python3-certbot-nginx
certbot --nginx -d vtgtool.help -d uat.vtgtool.help

# 6. Deploy!
./deploy.sh uat
./deploy.sh production

# 7. Access your environments
# UAT (code & test here): http://your-ip:8080 or https://uat.vtgtool.help
# Production: http://your-ip or https://vtgtool.help

# 8. Start coding! 🎉
```

---

**Investment:** $12-18/month (~$144-216/year) - VERY CHEAP!
**Return:** 
- 2 environments (UAT = dev+test, Production)
- Super simple setup & maintenance
- Docker isolation
- UAT doubles as development environment
- Easy to upgrade later
- Perfect for internal <100 users

**Worth it?** 💯 YES! Simple + Cost-effective + Good enough!

---

## 📋 **QUICK REFERENCE**

### **Ports:**
```
UAT (Development + Testing):
  Frontend: 8080
  Backend:  8001
  Access:   http://your-ip:8080 or https://uat.vtgtool.help

Production:
  Frontend: 80 (HTTP) / 443 (HTTPS)
  Backend:  80 (via Nginx) / 443 (via Nginx)  
  Access:   https://vtgtool.help
```

### **Databases:**
```
PostgreSQL:
  vtgtool_uat    (UAT - in Docker on droplet)
  vtgtool_prod   (Production - Managed DB or Docker)

Note: No separate dev database - UAT is your dev environment!
```

### **Useful Commands:**
```bash
# Check running services
docker ps
systemctl status postgresql
systemctl status redis

# View logs
docker-compose -f infra/docker-compose.yml logs -f

# Restart services
./deploy.sh uat
./deploy.sh production

# Git workflow
git checkout uat                    # Work on UAT
git checkout -b feature/xxx         # Create feature from UAT
git checkout main                   # Switch to production branch

# Backup database
docker-compose exec db pg_dump -U vtg_prod vtgtool_prod > backup.sql
```

---

*Optimized for: Internal projects with <100 users on DigitalOcean*
*Simple, cost-effective, and practical setup*
*Last updated: December 18, 2025*
