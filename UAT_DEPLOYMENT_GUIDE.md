# Hướng dẫn Triển khai & Quản lý Hệ thống (Monorepo)

Hệ thống `vtgtool` đã được tái cấu trúc thành dạng **Monorepo** để dễ dàng quản lý và triển khai đồng nhất.

## 1. Cấu trúc Dự án

```
vtgtool/
├── .github/workflows/   # Chứa workflow CI/CD chung (deploy.yml)
├── packages/
│   ├── frontend/        # Source code Frontend (React/Vite)
│   └── backend/         # Source code Backend (FastAPI/Python)
├── infra/               # Chứa file cấu hình Docker Compose
│   └── docker-compose.yml
├── .env.prod            # Biến môi trường cho Production
├── .env.uat             # Biến môi trường cho UAT
└── UAT_DEPLOYMENT_GUIDE.md
```

## 2. Quy trình Deploy Tự Động (CI/CD)

Hệ thống sử dụng GitHub Actions để tự động deploy dựa trên nhánh git:

*   **Deploy Production:** Khi push code vào nhánh **`main`**.
    *   Frontend chạy cổng: `8090` (Prod)
    *   Backend chạy cổng: `8000` (Prod)
    *   Domain: `vtgtool.help`

*   **Deploy UAT:** Khi push code vào nhánh **`uat`**.
    *   Frontend chạy cổng: `8080` (UAT)
    *   Backend chạy cổng: `8001` (UAT)
    *   Domain: `uat.vtgtool.help`

### Cách kích hoạt Deploy

1.  **Commit code:** Commit thay đổi của bạn vào nhánh tương ứng.
2.  **Push:**
    *   `git push origin main` -> Deploy Prod.
    *   `git push origin uat` -> Deploy UAT.

## 3. Cấu hình Nginx Gateway (Thực hiện 1 lần trên Server)

Bạn cần cấu hình Nginx trên server để điều hướng traffic vào đúng cổng của Docker container.

### Bước 1: Tạo/Sửa file config cho Prod (`vtgtool.help`)
```bash
sudo nano /etc/nginx/sites-available/vtgtool.help
```
Nội dung:
```nginx
server {
    listen 80;
    server_name vtgtool.help www.vtgtool.help;

    location / {
        proxy_pass http://localhost:8090; # Trỏ vào container Frontend PROD
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Bước 2: Tạo/Sửa file config cho UAT (`uat.vtgtool.help`)
```bash
sudo nano /etc/nginx/sites-available/uat.vtgtool.help
```
Nội dung:
```nginx
server {
    listen 80;
    server_name uat.vtgtool.help;

    location / {
        proxy_pass http://localhost:8080; # Trỏ vào container Frontend UAT
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Bước 3: Kích hoạt và Reload
```bash
sudo ln -s /etc/nginx/sites-available/vtgtool.help /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/uat.vtgtool.help /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. Quản lý Docker trên Server (Thủ công - Nếu cần)

Nếu cần can thiệp thủ công (restart, xem log), bạn làm như sau:

**Xem log:**
```bash
docker logs vtgtool-frontend-1  # Xem log Frontend Prod
docker logs vtgtool-backend-1   # Xem log Backend Prod
docker logs vtgtool-frontend-uat-1 # Xem log Frontend UAT
```

**Khởi động lại dịch vụ thủ công (ví dụ UAT):**
```bash
docker compose --env-file .env.uat -f infra/docker-compose.yml up -d