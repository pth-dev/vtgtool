# 🚀 VTG TOOL - DEVELOPMENT GUIDE

## 📋 MỤC LỤC
1. [Tổng quan môi trường](#-tổng-quan-môi-trường)
2. [Setup Dev Server](#-setup-dev-server)
3. [Daily Workflow](#-daily-workflow)
4. [Commands Reference](#-commands-reference)

---

## 🏗️ TỔNG QUAN MÔI TRƯỜNG

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENVIRONMENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DEV SERVER ($4/month)        PROD SERVER ($12/month)                   │
│  ═══════════════════          ════════════════════════                  │
│                                                                         │
│  ┌─────────────────┐          ┌─────────────┬─────────────┐            │
│  │   Development   │          │     UAT     │    PROD     │            │
│  │                 │          │             │             │            │
│  │  PostgreSQL     │          │  Port 5433  │  Managed DB │            │
│  │  Port: 5432     │          │  Port 8080  │  Port 80    │            │
│  │                 │          │  Port 8001  │  Port 8000  │            │
│  │  Backend:       │  ──────► │             │             │            │
│  │  localhost:8000 │  git     │             │             │            │
│  │                 │  push    │             │             │            │
│  │  Frontend:      │          │             │             │            │
│  │  localhost:5173 │          │             │             │            │
│  └─────────────────┘          └─────────────┴─────────────┘            │
│                                                                         │
│  Hot Reload: 1-2s             Deploy: 2-3 min                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Strategy:

| Environment | Type | Host | Port | Database | User |
|-------------|------|------|------|----------|------|
| **DEV** | Docker Container | localhost | 5432 | vtgtool_dev | vtg_dev |
| **UAT** | Docker Container | localhost | 5433 | vtgtool_uat | vtg_uat |
| **PROD** | DigitalOcean Managed | *.ondigitalocean.com | 25060 | defaultdb | doadmin |

---

## 💻 SETUP DEV SERVER

### Bước 1: Tạo Droplet mới

```
DigitalOcean → Create → Droplet
├── Image: Ubuntu 24.04
├── Plan: Basic $6/month (1GB RAM) hoặc $4 (512MB)
├── Region: Singapore
├── SSH Key: Add your key
└── Hostname: vtgtool-dev
```

### Bước 2: SSH và chạy setup

```bash
# SSH vào server mới
ssh root@YOUR_DEV_IP

# Clone repo
git clone https://github.com/pth-dev/vtgtool.git
cd vtgtool

# Checkout branch mới nhất
git checkout uat
git pull origin uat

# Cấp quyền execute cho scripts
chmod +x scripts/*.sh

# Start database services
cd infra
docker compose -f docker-compose.dev.yml up -d

# Quay lại root
cd ..
```

### Bước 3: Setup Backend

```bash
# Vào backend folder
cd packages/backend

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Cài dependencies
pip install -r requirements.txt

# Copy và config .env
cp .env.example .env
# Edit .env nếu cần (mặc định đã đúng cho dev)

# Init database
python init_db.py

# Chạy backend (hot reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Bước 4: Setup Frontend (Terminal mới)

```bash
# SSH vào server (terminal mới)
ssh root@YOUR_DEV_IP
cd vtgtool/packages/frontend

# Cài Node.js nếu chưa có
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Cài dependencies
npm install

# Chạy frontend (hot reload)
npm run dev -- --host 0.0.0.0
```

### Bước 5: Truy cập

```
Frontend: http://YOUR_DEV_IP:5173
Backend:  http://YOUR_DEV_IP:8000
API Docs: http://YOUR_DEV_IP:8000/docs
Adminer:  http://YOUR_DEV_IP:8081
```

---

## 🔄 DAILY WORKFLOW

### Development Flow:

```bash
# 1. Connect VS Code Remote SSH đến Dev Server
#    Extension: "Remote - SSH" → Connect → root@DEV_IP → /root/vtgtool

# 2. Pull latest code
git checkout uat
git pull origin uat

# 3. Tạo feature branch
git checkout -b feature/my-feature

# 4. Start services (nếu chưa chạy)
cd infra && docker compose -f docker-compose.dev.yml up -d && cd ..

# 5. Start backend (Terminal 1)
cd packages/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. Start frontend (Terminal 2)
cd packages/frontend
npm run dev -- --host 0.0.0.0

# 7. CODE! Changes auto-reload trong 1-2 giây

# 8. Commit và push
git add .
git commit -m "feat: description"
git push origin feature/my-feature

# 9. Tạo PR: feature/my-feature → uat (GitHub)

# 10. Sau khi merge, deploy UAT
ssh root@PROD_SERVER
cd /root/vtgtool
git checkout uat && git pull
make uat
```

---

## 📋 COMMANDS REFERENCE

### Dev Server:

```bash
# Database services
cd infra
docker compose -f docker-compose.dev.yml up -d    # Start DB + Redis
docker compose -f docker-compose.dev.yml down     # Stop
docker compose -f docker-compose.dev.yml logs -f  # Logs

# Backend
cd packages/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend  
cd packages/frontend
npm run dev -- --host 0.0.0.0
```

### Prod Server:

```bash
make uat          # Start UAT
make prod         # Start Production
make uat-logs     # UAT logs
make prod-logs    # Production logs
make status       # All containers
```

---

## 📁 FILE STRUCTURE

```
vtgtool/
├── Makefile                    # Quick commands (prod server)
├── DEVELOPMENT.md              # This file
├── scripts/
│   └── deploy.sh               # Deploy script
├── infra/
│   ├── docker-compose.dev.yml  # Dev: DB + Redis only
│   ├── docker-compose.uat.yml  # UAT: Full stack
│   ├── docker-compose.prod.yml # Prod: Full stack
│   └── envs/                   # Environment templates
├── packages/
│   ├── backend/
│   │   ├── .env.example        # Backend config template
│   │   ├── Dockerfile          # Production
│   │   └── Dockerfile.dev      # Development
│   └── frontend/
│       ├── Dockerfile          # Production
│       └── Dockerfile.dev      # Development
```

---

## 🔐 SECURITY NOTES

- ⚠️ DEV database chỉ chứa test data
- ⚠️ Không copy production data sang dev
- ⚠️ Mỗi môi trường dùng SECRET_KEY khác nhau
- ⚠️ .env files không được commit lên git

---
