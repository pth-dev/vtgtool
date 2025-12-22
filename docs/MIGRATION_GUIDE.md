# 🔧 Migration Guide: Chuyển sang Docker Registry Workflow

## 📋 Tổng quan thay đổi

### Trước (Cũ) - Không nên dùng
```
┌─────────────────────────────────────────────────────────────────────────┐
│   Developer         Server Production                                   │
│   ═════════         ════════════════                                    │
│                                                                         │
│   git push ──────► git pull (clone toàn bộ code)                       │
│                    docker compose build (build trên server)             │
│                    docker compose up                                    │
│                                                                         │
│   ⚠️ VẤN ĐỀ:                                                            │
│   • Server phải có đủ RAM/CPU để build                                  │
│   • Source code nằm trên production server (security risk)              │
│   • Build time lâu, downtime cao                                        │
│   • Khó rollback                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sau (Mới) - Chuẩn Industry
```
┌─────────────────────────────────────────────────────────────────────────┐
│   Developer        GitHub Actions        Docker Hub       Server        │
│   ═════════        ══════════════        ══════════       ══════        │
│                                                                         │
│   git push ──────► Build images ──────► Push images                     │
│                                              │                          │
│                                              ▼                          │
│                                         docker pull ◄──── SSH deploy   │
│                                         docker up                       │
│                                                                         │
│   ✅ ƯU ĐIỂM:                                                           │
│   • Server KHÔNG có source code (an toàn)                              │
│   • Server KHÔNG build (tiết kiệm tài nguyên)                          │
│   • Deploy nhanh (chỉ pull image ~30s)                                 │
│   • Rollback dễ (đổi IMAGE_TAG)                                        │
│   • Reproducible builds                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Thời gian ước tính

| Bước | Thời gian | Độ khó |
|------|-----------|--------|
| 1. Docker Hub Setup | 5 phút | Dễ |
| 2. Tạo SSH Key | 5 phút | Dễ |
| 3. GitHub Secrets | 5 phút | Dễ |
| 4. GitHub Environments | 2 phút | Dễ |
| 5. Setup Server | 10 phút | Trung bình |
| 6. Test thủ công | 5 phút | Dễ |
| 7. Commit & Push | 2 phút | Dễ |
| **Tổng** | **~35 phút** | |

---

## 📋 HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC

---

### 🔹 Bước 1: Setup Docker Hub (5 phút)

#### 1.1 Tạo tài khoản Docker Hub

1. Truy cập https://hub.docker.com
2. Click "Sign Up" (miễn phí)
3. Xác nhận email

#### 1.2 Tạo Access Token

1. Đăng nhập Docker Hub
2. Click avatar góc phải → **Account Settings**
3. Chọn **Security** → **New Access Token**
4. Đặt tên: `github-actions`
5. Permissions: **Read & Write**
6. Click **Generate**
7. **⚠️ COPY TOKEN NGAY** (chỉ hiển thị 1 lần!)

```
Token format: dckr_pat_xxxxxxxxxxxxxxxxxxxx
```

#### 1.3 Tạo Repositories

1. Click **Repositories** → **Create Repository**
2. Tạo 2 repos:
   - Name: `vtgtool-be` (Backend)
   - Name: `vtgtool-fe` (Frontend)
   - Visibility: Private (khuyến nghị) hoặc Public

---

### 🔹 Bước 2: Tạo SSH Key cho CI/CD (5 phút)

> ⚠️ **Quan trọng**: GitHub Actions KHÔNG thể dùng password, phải dùng SSH Key

#### 2.1 SSH vào server (dùng password như bình thường)

```bash
ssh root@YOUR_SERVER_IP
```

#### 2.2 Tạo SSH Key pair mới

```bash
# Tạo key pair cho GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions -N ""

# Giải thích options:
# -t ed25519     : Loại key (an toàn, nhanh)
# -C "..."       : Comment để nhận diện
# -f ~/.ssh/...  : Tên file output
# -N ""          : Không có passphrase (cần cho automation)
```

#### 2.3 Thêm Public Key vào authorized_keys

```bash
# Cho phép key này login vào server
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Đảm bảo permissions đúng
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### 2.4 Lấy Private Key (để đưa vào GitHub)

```bash
cat ~/.ssh/github_actions

# Output sẽ như thế này - COPY TOÀN BỘ:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
# QyNTUxOQAAACDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# ... nhiều dòng ...
# -----END OPENSSH PRIVATE KEY-----
```

#### 2.5 Test SSH Key (optional)

```bash
# Từ một terminal khác, test login bằng key
ssh -i ~/.ssh/github_actions root@YOUR_SERVER_IP

# Nếu login được mà KHÔNG hỏi password → OK!
```

---

### 🔹 Bước 3: Thêm GitHub Secrets (5 phút)

1. Vào GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** cho mỗi secret:

| Secret Name | Giá trị | Lấy từ đâu |
|-------------|---------|------------|
| `DOCKERHUB_USERNAME` | Username Docker Hub | Bước 1.1 |
| `DOCKERHUB_TOKEN` | Access Token | Bước 1.2 |
| `PROD_SSH_HOST` | IP server | DigitalOcean Dashboard |
| `PROD_SSH_KEY` | Nội dung file `github_actions` | Bước 2.4 |
| `UAT_SSH_HOST` | = PROD_SSH_HOST (nếu chung) | |
| `UAT_SSH_KEY` | = PROD_SSH_KEY (nếu chung) | |

**Lưu ý khi paste SSH Key:**
- Copy **TOÀN BỘ** từ `-----BEGIN...` đến `...END-----`
- Bao gồm cả dòng trống cuối cùng nếu có

---

### 🔹 Bước 4: Tạo GitHub Environments (2 phút)

1. Vào GitHub repo → **Settings** → **Environments**
2. Click **New environment**:
   - Name: `production`
   - (Optional) Tick **Required reviewers** → Thêm tên bạn
3. Click **New environment**:
   - Name: `uat`

---

### 🔹 Bước 5: Setup Production Server (10 phút)

#### 5.1 SSH vào server

```bash
ssh root@YOUR_SERVER_IP
```

#### 5.2 Tạo thư mục deployment

```bash
# Tạo thư mục mới (KHÔNG dùng /root/vtgtool cũ)
mkdir -p /opt/vtgtool/nginx
cd /opt/vtgtool
```

#### 5.3 Tạo file docker-compose.yml

```bash
cat > /opt/vtgtool/docker-compose.yml << 'EOF'
services:
  redis:
    image: redis:7-alpine
    container_name: vtg-redis
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 3
    networks:
      - vtg-network

  backend:
    image: ${DOCKERHUB_USERNAME}/vtgtool-be:${IMAGE_TAG:-latest}
    container_name: vtg-backend
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=${ENVIRONMENT:-production}
      - UPLOAD_DIR=/app/uploads
    volumes:
      - uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - vtg-network

  frontend:
    image: ${DOCKERHUB_USERNAME}/vtgtool-fe:${IMAGE_TAG:-latest}
    container_name: vtg-frontend
    restart: always
    ports:
      - "${FRONTEND_PORT:-80}:80"
      - "${FRONTEND_SSL_PORT:-443}:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx/${NGINX_CONFIG:-prod.conf}:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - vtg-network

networks:
  vtg-network:
    driver: bridge

volumes:
  uploads:
EOF
```

#### 5.4 Tạo file .env

```bash
cat > /opt/vtgtool/.env << 'EOF'
# Docker Registry
DOCKERHUB_USERNAME=YOUR_DOCKERHUB_USERNAME
IMAGE_TAG=latest

# Environment
ENVIRONMENT=production

# Ports
FRONTEND_PORT=80
FRONTEND_SSL_PORT=443

# Nginx config file
NGINX_CONFIG=prod.conf

# Database (DigitalOcean Managed DB)
DATABASE_URL=postgresql+asyncpg://doadmin:YOUR_DB_PASSWORD@YOUR_DB_HOST:25060/defaultdb?sslmode=require

# Security - Generate với: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=CHANGE_ME_TO_SECURE_RANDOM_STRING
EOF

# Sửa file với giá trị thực
nano /opt/vtgtool/.env
```

#### 5.5 Tạo nginx config

```bash
cat > /opt/vtgtool/nginx/prod.conf << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name vtgtool.help www.vtgtool.help;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name vtgtool.help www.vtgtool.help;

    # SSL
    ssl_certificate /etc/letsencrypt/live/vtgtool.help/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vtgtool.help/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Upload size
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
    }
}
EOF
```

#### 5.6 Kiểm tra cấu trúc

```bash
ls -la /opt/vtgtool/

# Kết quả mong đợi:
# docker-compose.yml
# .env
# nginx/
#   └── prod.conf
```

---

### 🔹 Bước 6: Test Deployment Thủ Công (5 phút)

> ⚠️ Chỉ làm SAU KHI đã push images lên Docker Hub (qua CI/CD hoặc manual)

```bash
cd /opt/vtgtool

# Login Docker Hub (lần đầu)
docker login -u YOUR_DOCKERHUB_USERNAME

# Pull images
docker compose pull

# Start services
docker compose up -d

# Kiểm tra status
docker compose ps

# Xem logs
docker compose logs -f

# Test endpoints
curl http://localhost/health
curl http://localhost/api/health
```

---

### 🔹 Bước 7: Commit và Push (2 phút)

```bash
# Trên máy local (nơi có repo)
cd /root/vtgtool

git add .
git commit -m "refactor: migrate to Docker Registry workflow

- Add deploy/ folder for production deployment
- Update CI/CD workflow for registry-based deployment
- Remove redundant nginx and docker-compose configs
- Add migration documentation"

# Push để trigger CI/CD
git push origin main      # → Deploy Production
git push origin develop   # → Deploy UAT
```

---

### 🔹 Bước 8: Dọn dẹp Server Cũ (Sau khi OK)

```bash
# ⚠️ CHỈ làm sau khi deploy mới hoạt động OK!

# Backup data quan trọng
cp -r /root/vtgtool/uploads /opt/vtgtool/uploads_backup

# Stop containers cũ
cd /root/vtgtool
docker compose down

# Xóa folder cũ (CẨN THẬN!)
# rm -rf /root/vtgtool

# Cleanup Docker images không dùng
docker system prune -a
```

---

## 🔄 Workflow Hàng Ngày (Sau Migration)

### Deploy code mới

```bash
# 1. Code xong, commit
git add .
git commit -m "feat: new feature"

# 2. Push
git push origin develop   # → Auto deploy UAT
git push origin main      # → Auto deploy Production

# 3. Xem CI/CD
# GitHub repo → Actions → Xem workflow chạy
```

### Rollback

```bash
# SSH vào server
ssh root@YOUR_SERVER_IP
cd /opt/vtgtool

# Đổi về image cũ
nano .env
# Sửa: IMAGE_TAG=abc1234  (commit SHA cũ)

# Restart
docker compose up -d
```

### Xem logs

```bash
cd /opt/vtgtool
docker compose logs -f backend
docker compose logs -f frontend
```

---

## ❓ Troubleshooting

### GitHub Actions lỗi SSH

```
Error: ssh: handshake failed: ssh: unable to authenticate
```

**Giải pháp:**
1. Kiểm tra SSH key đã thêm đúng chưa
2. Đảm bảo copy toàn bộ key (từ BEGIN đến END)
3. Kiểm tra authorized_keys trên server

### Images không pull được

```bash
# Trên server, test manual:
docker login -u YOUR_USERNAME
docker pull YOUR_USERNAME/vtgtool-be:latest

# Nếu lỗi "denied" → Kiểm tra:
# - Repo có tồn tại không
# - Username/token đúng không
```

### Container không start

```bash
# Xem logs chi tiết
docker compose logs backend
docker compose logs frontend

# Kiểm tra health
curl http://localhost:8000/health

# Kiểm tra env vars
docker compose config
```

### SSL Certificate Issues

```bash
# Kiểm tra cert tồn tại
ls -la /etc/letsencrypt/live/vtgtool.help/

# Renew nếu hết hạn
certbot renew

# Restart nginx
docker compose restart frontend
```

### Database Connection Failed

```bash
# Test connection từ server
psql "postgresql://doadmin:PASSWORD@HOST:25060/defaultdb?sslmode=require"

# Kiểm tra DATABASE_URL trong .env
cat /opt/vtgtool/.env | grep DATABASE
```

---

## 📁 Cấu trúc Files Sau Migration

```
Repository (GitHub):
├── .github/workflows/
│   ├── ci-cd.yml           # Test pipeline
│   └── deploy.yml          # Build + Deploy
├── deploy/                  # Deploy configs (reference)
│   ├── docker-compose.yml
│   ├── docker-compose.uat.yml
│   ├── .env.example
│   └── nginx/
│       ├── prod.conf
│       └── uat.conf
├── packages/
│   ├── backend/
│   │   └── Dockerfile
│   └── frontend/
│       ├── Dockerfile
│       └── nginx.default.conf
└── infra/
    └── docker-compose.dev.yml  # Local dev only

Production Server (/opt/vtgtool):
├── docker-compose.yml
├── .env
├── nginx/
│   └── prod.conf
└── logs/
```
