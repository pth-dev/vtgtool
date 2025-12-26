# 🛠️ VTGTOOL Scripts

Automation scripts for deployment and maintenance.

---

## 📁 Scripts

### 1. `setup-uat-db.sh` - UAT Database Separation

**Purpose:** Tách riêng database UAT khỏi Production

**When to use:**
- Lần đầu setup UAT server
- Khi UAT đang dùng chung DB với Production (nguy hiểm!)
- Khi cần reset UAT database

**Usage:**
```bash
# On UAT server
cd /opt/vtgtool
chmod +x scripts/setup-uat-db.sh
./scripts/setup-uat-db.sh
```

**What it does:**
1. ✅ Backup current .env
2. ✅ Update .env for UAT (ENVIRONMENT=staging, IMAGE_TAG=uat)
3. ✅ Generate secure DB password
4. ✅ Stop current services
5. ✅ Start with local PostgreSQL container
6. ✅ Initialize database
7. ✅ Create admin user (admin@vtgtool.com / Admin@123)

**Time:** ~2-3 minutes

---

### 2. `verify-uat-separation.sh` - Verification

**Purpose:** Kiểm tra xem UAT đã tách riêng DB chưa

**When to use:**
- Sau khi chạy `setup-uat-db.sh`
- Định kỳ để đảm bảo UAT không dùng Production DB
- Trước khi test trên UAT

**Usage:**
```bash
# On UAT server
cd /opt/vtgtool
chmod +x scripts/verify-uat-separation.sh
./scripts/verify-uat-separation.sh
```

**What it checks:**
1. ✅ UAT PostgreSQL container đang chạy
2. ✅ Backend đang dùng UAT database (không phải Production)
3. ✅ ENVIRONMENT variable đúng
4. ✅ Database connectivity
5. ✅ Database name
6. ✅ .env configuration
7. ✅ Docker compose files
8. ✅ Database query test

**Exit codes:**
- `0` - All checks passed
- `1` - Critical errors found (UAT may be using Production DB!)

---

## 🚀 Quick Start

### First-time UAT Setup

```bash
# 1. SSH to UAT server
ssh root@UAT_SERVER_IP

# 2. Go to deployment directory
cd /opt/vtgtool

# 3. Make scripts executable
chmod +x scripts/*.sh

# 4. Run setup
./scripts/setup-uat-db.sh

# 5. Verify
./scripts/verify-uat-separation.sh

# 6. Test login
curl http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vtgtool.com","password":"Admin@123"}'
```

---

## 📋 Checklist

### Before Running Scripts

- [ ] Confirmed you're on UAT server (NOT Production!)
- [ ] Backed up important data
- [ ] Have access to .env file
- [ ] Docker and Docker Compose installed

### After Running Scripts

- [ ] Run `verify-uat-separation.sh` - all checks pass
- [ ] Can login with admin credentials
- [ ] Frontend accessible
- [ ] No errors in logs (`docker compose logs -f`)

---

## 🔧 Troubleshooting

### Script fails with "Permission denied"

```bash
chmod +x scripts/*.sh
```

### Database container won't start

```bash
# Check logs
docker compose logs db

# Remove old volume and restart
docker compose down -v
./scripts/setup-uat-db.sh
```

### Backend can't connect to database

```bash
# Check DATABASE_URL
docker exec vtg-backend env | grep DATABASE_URL

# Should see: @db:5432/vtgtool_uat
# If not, re-run setup script
```

### Admin user already exists

```bash
# Reset password
docker exec -it vtg-db-uat psql -U vtg_uat vtgtool_uat

# In psql:
UPDATE users SET password_hash = '$2b$12$...' WHERE email = 'admin@vtgtool.com';
\q
```

---

## 📚 Related Documentation

- `UAT_DATABASE_SEPARATION_GUIDE.md` - Detailed manual steps
- `deploy/README.md` - Deployment guide
- `deploy/docker-compose.uat.yml` - UAT configuration

---

## ⚠️ Important Notes

### DO NOT run on Production server!

These scripts are for **UAT ONLY**. Running on Production will:
- ❌ Change database to local container
- ❌ Lose connection to managed database
- ❌ Cause downtime

### Always verify after running

```bash
./scripts/verify-uat-separation.sh
```

If verification fails, **DO NOT proceed with testing!**

---

## 🆘 Emergency Rollback

If something goes wrong:

```bash
# 1. Stop services
docker compose down

# 2. Restore .env
cp .env.backup.YYYYMMDD_HHMMSS .env

# 3. Start with original config
docker compose up -d

# 4. Check logs
docker compose logs -f
```

---

## 📞 Support

For issues:
1. Check logs: `docker compose logs -f`
2. Run verification: `./scripts/verify-uat-separation.sh`
3. Review: `UAT_DATABASE_SEPARATION_GUIDE.md`
4. Contact: dev@vtgtool.com

