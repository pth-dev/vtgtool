# 🚀 VTG TOOL - QUICK START GUIDE

> Simplified 2-environment setup: UAT + Production

## 📋 TÓM TẮT

```
Architecture: 1 Droplet, 2 Environments
├── UAT (Port 8080/8001) - Development + Testing
└── Production (Port 80/443) - Production Users
```

## ⚡ CURRENT STATUS

```bash
# Check environment status:
docker ps

# UAT Environment (Development + Testing):
✅ vtgtool-backend-uat-1   - Port 8001 (API)
✅ vtgtool-db-uat-1         - PostgreSQL
✅ vtgtool-redis-uat-1      - Redis (6380)

# Production Environment:
✅ infra-backend-1          - Port 8000 (API)
✅ infra-frontend-1         - Port 80/443
✅ infra-redis-1            - Redis (6379)
```

**Access URLs:**
- UAT API: http://your-ip:8001/docs
- Production: http://your-ip or https://vtgtool.help

---

## 🔄 DEVELOPMENT WORKFLOW

### **Simple Flow:**
```
1. Code trên UAT branch
2. Test trên UAT (port 8001)
3. Merge uat → main
4. Deploy production
```

### **Step-by-Step:**

```bash
# 1. Work on UAT
cd /root/vtgtool
git checkout uat
git pull origin uat

# 2. Create feature (optional)
git checkout -b feature/new-feature

# 3. Code directly on server
# Use VS Code Remote SSH or vim/nano
# Edit: packages/backend/* or packages/frontend/*

# 4. Commit changes
git add .
git commit -m "feat: your feature"

# 5. Merge to UAT
git checkout uat
git merge feature/new-feature  # or: git add/commit if working directly on uat
git push origin uat

# 6. Restart UAT to test
docker restart vtgtool-backend-uat-1

# 7. Test on UAT
curl http://localhost:8001/docs

# 8. When stable, deploy to production
# Create PR on GitHub: uat → main
# Then:
git checkout main
git pull origin main
cd infra
docker compose down
docker compose up -d --build
```

---

## 📝 COMMON COMMANDS

### **View Logs:**
```bash
# UAT
docker logs vtgtool-backend-uat-1 -f

# Production
docker logs infra-backend-1 -f
docker logs infra-frontend-1 -f
```

### **Restart Services:**
```bash
# UAT
docker restart vtgtool-backend-uat-1

# Production
cd /root/vtgtool/infra
docker compose restart
```

### **Database Access:**
```bash
# UAT
docker exec -it vtgtool-db-uat-1 psql -U vtg_uat vtgtool_uat

# List tables
\dt

# Query
SELECT * FROM users LIMIT 5;
```

### **Check Health:**
```bash
# UAT
curl http://localhost:8001/docs

# Production
curl http://localhost:8000/docs
curl http://localhost
```

---

## 🌿 GIT STRATEGY

```
main (Production)
  ↑
  | (PR when stable)
  |
uat (Development + Testing)
  ↑
  | (checkout features)
  |
feature/* (Optional)
```

**Branches:**
- `main` - Production code
- `uat` - Development & testing (code here!)
- `feature/*` - Optional feature branches

---

## 🎯 PORTS

| Env | Service | Port | URL |
|-----|---------|------|-----|
| UAT | Backend | 8001 | http://ip:8001/docs |
| UAT | Redis | 6380 | Internal |
| Prod | Frontend | 80/443 | http://ip |
| Prod | Backend | 8000 | Internal |
| Prod | Redis | 6379 | Internal |

---

## 🆘 TROUBLESHOOTING

### **Container not running:**
```bash
docker ps -a  # See all containers
docker logs <container-name>  # Check logs
docker restart <container-name>  # Restart
```

### **Port conflict:**
```bash
lsof -i :8001  # Find process
fuser -k 8001/tcp  # Kill process
```

### **Database issue:**
```bash
# Check DB running
docker ps | grep db

# Connect to DB
docker exec -it vtgtool-db-uat-1 psql -U vtg_uat vtgtool_uat
```

---

## 📚 MORE DOCS

- [DIGITALOCEAN_DEPLOYMENT.md](DIGITALOCEAN_DEPLOYMENT.md) - Complete setup guide
- [README.md](README.md) - Project overview

---

**Ready to code? Work on UAT branch!** 🎉

```bash
cd /root/vtgtool
git checkout uat
# Start coding!
```
