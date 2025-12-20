# 🚀 DEPLOYMENT GUIDE

## 📋 QUY TRÌNH DEPLOY

### **Workflow:**
```
feature/* → uat → main
   ↓         ↓      ↓
  Dev      UAT    Prod
```

---

## 🔧 SETUP LẦN ĐẦU (Trên Prod Server)

### 1. Tạo file .env cho UAT
```bash
cd /root/vtgtool/infra
cp envs/.env.uat.example .env.uat

# Edit .env.uat
nano .env.uat
# Cập nhật: DB_PASSWORD, SECRET_KEY
```

### 2. Tạo file .env cho Production
```bash
cp envs/.env.prod.example .env.prod

# Edit .env.prod  
nano .env.prod
# Cập nhật: DATABASE_URL, SECRET_KEY
```

---

## ⚡ DEPLOY

### **Deploy UAT (từ uat branch):**
```bash
cd /root/vtgtool
./deploy.sh uat
```

### **Deploy Production (từ main branch):**
```bash
cd /root/vtgtool
./deploy.sh prod
```

---

## 📝 CHI TIẾT QUY TRÌNH

### **1. Development (Dev Server)**
```bash
# Trên Dev Server
git checkout uat
git pull origin uat
git checkout -b feature/my-feature

# Code...
# Test với hot reload

git add .
git commit -m "feat: my feature"
git push origin feature/my-feature

# Tạo PR: feature/my-feature → uat
```

### **2. Deploy UAT (Prod Server)**
```bash
# Sau khi merge PR vào uat
ssh root@PROD_SERVER
cd /root/vtgtool

# Deploy
./deploy.sh uat

# Kiểm tra
curl http://localhost:8001/health
# Hoặc truy cập: http://YOUR_IP:8080
```

### **3. Deploy Production (Prod Server)**
```bash
# Sau khi test UAT OK, tạo PR: uat → main
# Merge PR trên GitHub

ssh root@PROD_SERVER
cd /root/vtgtool

# Deploy
./deploy.sh prod

# Kiểm tra
curl http://localhost:8000/health
# Hoặc truy cập: https://vtgtool.help
```

---

## 🔍 MONITORING & TROUBLESHOOTING

### **Xem logs:**
```bash
# UAT
docker compose -f infra/docker-compose.uat.yml logs -f

# Production
docker compose -f infra/docker-compose.prod.yml logs -f

# Specific service
docker compose -f infra/docker-compose.prod.yml logs -f backend
```

### **Restart services:**
```bash
# UAT
docker compose -f infra/docker-compose.uat.yml restart

# Production
docker compose -f infra/docker-compose.prod.yml restart
```

### **Stop services:**
```bash
./deploy.sh uat    # sẽ stop trước khi deploy
# Hoặc
docker compose -f infra/docker-compose.uat.yml down
```

---

## 🗄️ DATABASE

| Environment | Host | Port | Database | User |
|-------------|------|------|----------|------|
| UAT | Container | 5433 | vtgtool_uat | vtg_uat |
| Production | Managed DB | 25060 | defaultdb | doadmin |

### **Backup Production DB:**
```bash
# DigitalOcean tự động backup daily
# Manual backup:
pg_dump -h HOST -U USER -d DATABASE > backup.sql
```

---

## ⚠️ ROLLBACK

```bash
# Nếu deploy lỗi, rollback về commit trước
git log --oneline -5
git checkout <previous-commit-hash>
./deploy.sh prod

# Hoặc revert
git revert HEAD
git push origin main
./deploy.sh prod
```
