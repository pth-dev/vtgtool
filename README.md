# VTG Tool Project

Dự án VTG Tool là một nền tảng phân tích dữ liệu nội bộ cho ngành may mặc, bao gồm frontend (React/TypeScript) và backend (FastAPI/Python).

## 📁 Cấu trúc dự án

```
vtgtool/
├── frontend/          # React + TypeScript + Vite
└── backend/           # FastAPI + Python
```

## 🎨 Frontend (vtg-tool-fe)

### Công nghệ sử dụng:
- **Framework**: React 18.2.0 với TypeScript
- **Build Tool**: Vite 5.0.10
- **UI Library**: Material-UI (MUI) v7.3.6
- **State Management**: Zustand 4.4.7
- **Data Fetching**: TanStack React Query 5.17.0
- **Routing**: React Router DOM 6.21.0
- **Charts**: ApexCharts 5.3.6 với react-apexcharts
- **Tables**: TanStack React Table 8.21.3

### Cấu trúc thư mục:
```
frontend/
├── src/
│   ├── components/    # Các component UI
│   ├── pages/         # Các trang
│   ├── services/      # API services
│   ├── stores/        # Zustand stores
│   ├── hooks/         # Custom hooks
│   ├── config/        # Cấu hình
│   ├── App.tsx        # Component chính
│   ├── main.tsx       # Entry point
│   └── routes.tsx     # Định nghĩa routes
├── public/            # Static files
├── Dockerfile         # Docker config cho production
├── nginx.conf         # Nginx config
└── package.json       # Dependencies
```

### Scripts:
- `npm run dev` - Chạy development server (port 5173)
- `npm run build` - Build production
- `npm run preview` - Preview production build

### Cấu hình:
- Port: 5173 (development)
- Proxy API: `/api` → `http://localhost:8000`
- Theme: Primary (#012E72), Secondary (#FBAD18)

## 🔧 Backend (vtg-tool-be)

### Công nghệ sử dụng:
- **Framework**: FastAPI 0.109.0
- **Server**: Uvicorn 0.27.0
- **Database**: PostgreSQL với SQLAlchemy 2.0.25 (async)
- **Authentication**: python-jose + passlib
- **Data Processing**: Pandas 2.1.4
- **Excel Support**: openpyxl 3.1.2, xlrd 2.0.1

### Cấu trúc thư mục:
```
backend/
├── app/
│   ├── api/           # API routes
│   │   ├── auth.py           # Authentication
│   │   ├── dashboard.py      # Dashboard
│   │   ├── datasources.py    # Data Sources
│   │   ├── datasets.py       # Datasets
│   │   ├── charts.py         # Charts
│   │   └── export.py         # Export
│   ├── core/          # Core config (database, security)
│   ├── models/        # Database models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── utils/         # Utilities
├── migrations/        # Database migrations
├── uploads/          # Uploaded files
├── main.py           # FastAPI app entry point
├── init_db.py        # Database initialization
├── Dockerfile        # Docker config
└── requirements.txt  # Python dependencies
```

### API Endpoints:
- `/api/auth` - Authentication
- `/api/dashboard` - Dashboard data
- `/api/datasources` - Data Sources management
- `/api/datasets` - Datasets management
- `/api/charts` - Charts management
- `/api/export` - Data export
- `/health` - Health check
- `/docs` - Swagger documentation
- `/redoc` - ReDoc documentation

### Cấu hình:
- Port: 8000
- CORS: Cho phép localhost:5173, localhost:3000, localhost:80
- Database: PostgreSQL (async với asyncpg)

## 🐳 Docker

Cả frontend và backend đều có Dockerfile sẵn:

- **Frontend**: Multi-stage build với Node.js và Nginx
- **Backend**: Python 3.11-slim với PostgreSQL dependencies

## 🚀 Cách chạy dự án

### Development

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

#### Backend:
```bash
cd backend
pip install -r requirements.txt
# Cần cấu hình database trước
uvicorn main:app --reload
```

### Production với Docker:
```bash
# Frontend
cd frontend
docker build -t vtg-tool-fe .
docker run -p 80:80 vtg-tool-fe

# Backend
cd backend
docker build -t vtg-tool-be .
docker run -p 8000:8000 vtg-tool-be
```

## 📝 Ghi chú

- Backend sử dụng PostgreSQL, cần cấu hình database connection
- Frontend proxy API requests đến backend qua `/api`
- Cả hai repo đều đã có Dockerfile sẵn cho production deployment
- Backend có script `init_db.py` để khởi tạo database tables

