# 🔧 UAT Database Separation Guide

## ⚠️ VẤN ĐỀ HIỆN TẠI

**UAT và Production đang dùng CHUNG database** → Rất nguy hiểm!

### Rủi ro:
- ❌ UAT test có thể làm hỏng data Production
- ❌ Không thể test migration/schema changes an toàn
- ❌ UAT data lẫn với Production data
- ❌ Không thể rollback UAT mà không ảnh hưởng Production

---

## ✅ GIẢI PHÁP

Tách riêng database cho UAT bằng cách sử dụng **local PostgreSQL container** (đã có sẵn trong `docker-compose.uat.yml`)

---

## 🚀 CÁCH FIX (Trên UAT Server)

### Bước 1: SSH vào UAT server

```bash
ssh root@UAT_SERVER_IP
cd /opt/vtgtool
```

### Bước 2: Kiểm tra file hiện tại

```bash
# Xem DATABASE_URL hiện tại
cat .env | grep DATABASE_URL

# Nếu thấy URL giống Production → Đang dùng chung DB!
```

### Bước 3: Backup .env hiện tại

```bash
cp .env .env.backup
```

### Bước 4: Cập nhật .env cho UAT

```bash
nano .env
```

**Thay đổi các dòng sau:**

```bash
# BEFORE (đang dùng Production DB - SAI!)
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://doadmin:xxx@production-db.ondigitalocean.com:25060/defaultdb
NGINX_CONFIG=prod.conf
IMAGE_TAG=latest

# AFTER (dùng local UAT DB - ĐÚNG!)
ENVIRONMENT=staging
DATABASE_URL=postgresql+asyncpg://vtg_uat:uat_secure_password_2024@db:5432/vtgtool_uat
NGINX_CONFIG=uat.conf
IMAGE_TAG=uat
DB_PASSWORD=uat_secure_password_2024
```

**Lưu ý:** 
- `DATABASE_URL` sẽ bị override bởi `docker-compose.uat.yml` nên có thể để nguyên
- Quan trọng là set `ENVIRONMENT=staging` và `IMAGE_TAG=uat`

### Bước 5: Stop services hiện tại

```bash
# Stop tất cả containers
docker compose down
```

### Bước 6: Start với UAT configuration

```bash
# Start với UAT override (bao gồm local PostgreSQL)
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d

# Xem logs
docker compose logs -f
```

### Bước 7: Verify database separation

```bash
# Check containers đang chạy
docker ps

# Phải thấy container: vtg-db-uat (PostgreSQL cho UAT)

# Check backend logs
docker compose logs backend | grep "DATABASE_URL"

# Phải thấy: postgresql+asyncpg://vtg_uat:xxx@db:5432/vtgtool_uat
```

### Bước 8: Initialize UAT database

```bash
# Exec vào backend container
docker exec -it vtg-backend bash

# Run migrations
cd /app
python init_db.py

# Exit
exit
```

### Bước 9: Create admin user cho UAT

```bash
# Exec vào backend container
docker exec -it vtg-backend bash

# Create admin
python -c "
from app.core.database import async_session
from app.models.models import User
from app.core.security import hash_password
import asyncio

async def create_admin():
    async with async_session() as db:
        admin = User(
            email='admin@vtgtool.com',
            password_hash=hash_password('Admin@123'),
            full_name='UAT Admin',
            role='admin'
        )
        db.add(admin)
        await db.commit()
        print('✅ Admin created: admin@vtgtool.com / Admin@123')

asyncio.run(create_admin())
"

exit
```

---

## 🔍 VERIFICATION CHECKLIST

### ✅ Kiểm tra UAT đã tách riêng DB:

```bash
# 1. Check containers
docker ps | grep vtg

# Phải có:
# - vtg-db-uat (PostgreSQL)
# - vtg-backend
# - vtg-frontend
# - vtg-redis

# 2. Check database connection
docker exec vtg-backend env | grep DATABASE_URL

# Phải thấy: @db:5432/vtgtool_uat (KHÔNG phải production DB)

# 3. Check environment
docker exec vtg-backend env | grep ENVIRONMENT

# Phải thấy: ENVIRONMENT=staging hoặc uat

# 4. Test login
curl http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vtgtool.com","password":"Admin@123"}'

# Phải thấy: {"message":"Login successful"}
```

---

## 📊 ARCHITECTURE SAU KHI FIX

### Production:
```
Frontend (Docker) → Backend (Docker) → Managed PostgreSQL (DigitalOcean)
                                    → Redis (Docker)
```

### UAT:
```
Frontend (Docker) → Backend (Docker) → PostgreSQL (Docker Container - LOCAL)
                                    → Redis (Docker)
```

**Key difference:** UAT dùng local PostgreSQL container, hoàn toàn tách biệt với Production!

---

## 🔄 CI/CD Flow (Đã đúng)

### UAT Branch Push:
1. GitHub Actions build images với tag `uat`
2. Push to Docker Hub: `vtgtool-be:uat`, `vtgtool-fe:uat`
3. SSH vào UAT server
4. Pull images mới
5. Restart với `docker-compose.uat.yml` → Dùng local DB

### Main Branch Push:
1. GitHub Actions build images với tag `latest`
2. Push to Docker Hub: `vtgtool-be:latest`, `vtgtool-fe:latest`
3. SSH vào Production server
4. Pull images mới
5. Restart với `docker-compose.yml` → Dùng managed DB

---

## 🛡️ BEST PRACTICES

### 1. Tạo alias cho dễ quản lý

```bash
# Thêm vào ~/.bashrc trên UAT server
echo 'alias uat-up="docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d"' >> ~/.bashrc
echo 'alias uat-down="docker compose -f docker-compose.yml -f docker-compose.uat.yml down"' >> ~/.bashrc
echo 'alias uat-logs="docker compose logs -f"' >> ~/.bashrc
echo 'alias uat-restart="docker compose -f docker-compose.yml -f docker-compose.uat.yml restart"' >> ~/.bashrc
source ~/.bashrc

# Sử dụng:
uat-up      # Start UAT
uat-down    # Stop UAT
uat-logs    # View logs
uat-restart # Restart
```

### 2. Backup UAT database định kỳ

```bash
# Backup
docker exec vtg-db-uat pg_dump -U vtg_uat vtgtool_uat > uat_backup_$(date +%Y%m%d).sql

# Restore
cat uat_backup_20241225.sql | docker exec -i vtg-db-uat psql -U vtg_uat vtgtool_uat
```

### 3. Monitor disk space

```bash
# Check volume size
docker volume inspect vtg-pgdata-uat

# Clean old data nếu cần
docker exec -it vtg-db-uat psql -U vtg_uat vtgtool_uat -c "DELETE FROM dashboard_data WHERE created_at < NOW() - INTERVAL '30 days';"
```

---

## ❓ FAQ

**Q: UAT có thể access Production DB không?**  
A: KHÔNG! Sau khi fix, UAT hoàn toàn tách biệt.

**Q: Làm sao sync data từ Production sang UAT để test?**  
A: 
```bash
# 1. Dump từ Production (trên prod server)
pg_dump production_db > prod_dump.sql

# 2. Copy sang UAT
scp prod_dump.sql root@uat-server:/tmp/

# 3. Import vào UAT (trên uat server)
cat /tmp/prod_dump.sql | docker exec -i vtg-db-uat psql -U vtg_uat vtgtool_uat
```

**Q: UAT container restart có mất data không?**  
A: KHÔNG! Data lưu trong Docker volume `vtg-pgdata-uat` (persistent)

---

## 🎯 SUMMARY

✅ **Trước fix:** UAT + Production dùng chung DB (nguy hiểm!)  
✅ **Sau fix:** UAT dùng local PostgreSQL container (an toàn!)  
✅ **Effort:** 10-15 phút  
✅ **Risk:** Thấp (chỉ ảnh hưởng UAT, không động Production)

