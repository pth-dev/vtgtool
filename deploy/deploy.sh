#!/bin/bash
# =============================================
# Production Deployment Script
# =============================================
# Usage: 
#   ./deploy.sh              # Deploy only
#   ./deploy.sh rebuild      # Rebuild images and deploy
#   ./deploy.sh backup       # Backup database before deploy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 VTG Tool Production Deployment${NC}"
echo "================================================"

# Check .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Copy .env.example to .env and fill in values"
    exit 1
fi

# Backup database
if [ "$1" = "backup" ] || [ "$2" = "backup" ]; then
    echo -e "${YELLOW}📦 Backing up database...${NC}"
    mkdir -p backups
    BACKUP_FILE="backups/vtgtool_$(date +%Y%m%d_%H%M%S).sql"
    docker exec vtg-db-prod pg_dump -U vtg_prod vtgtool_prod > "$BACKUP_FILE" 2>/dev/null || echo "No existing database to backup"
    echo -e "${GREEN}✅ Backup saved to $BACKUP_FILE${NC}"
fi

# Rebuild images
if [ "$1" = "rebuild" ]; then
    echo -e "${YELLOW}🔨 Rebuilding images from source...${NC}"
    
    # Check if source directory exists
    SOURCE_DIR="/root/vtgtool"
    if [ ! -d "$SOURCE_DIR" ]; then
        echo -e "${RED}❌ Source directory not found at $SOURCE_DIR${NC}"
        echo "Please clone the repository first:"
        echo "  git clone <repo-url> $SOURCE_DIR"
        exit 1
    fi
    
    echo "Building backend..."
    cd "$SOURCE_DIR/packages/backend"
    docker build -t vtgtool-be:prod .
    
    echo "Building frontend..."
    cd "$SOURCE_DIR/packages/frontend"
    docker build -t vtgtool-fe:prod .
    
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✅ Images rebuilt successfully${NC}"
fi

# Deploy
echo -e "${YELLOW}🚢 Starting deployment...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for services
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# Health check
echo -e "${YELLOW}🏥 Running health checks...${NC}"
if curl -sf https://vtgtool.help/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: OK${NC}"
else
    echo -e "${RED}❌ Frontend: FAILED${NC}"
fi

if docker exec vtg-backend-prod curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: OK${NC}"
else
    echo -e "${RED}❌ Backend: FAILED${NC}"
fi

# Show status
echo ""
echo -e "${GREEN}📊 Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep vtg

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "================================================"
echo "Production URL: https://vtgtool.help"

