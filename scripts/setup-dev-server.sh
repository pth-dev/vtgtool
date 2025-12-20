#!/bin/bash
# =============================================
# DEV SERVER SETUP SCRIPT
# =============================================
# Run this script on a fresh server to setup dev environment
# Usage: curl -sSL https://raw.githubusercontent.com/.../setup-dev-server.sh | bash

set -e

echo "🚀 Setting up VTG Tool Dev Server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# 2. Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 3. Install Docker Compose
echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# 4. Install useful tools
echo -e "${YELLOW}🛠️  Installing tools...${NC}"
apt-get install -y git curl vim htop

# 5. Clone repository (if not exists)
if [[ ! -d "/root/vtgtool" ]]; then
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    cd /root
    git clone https://github.com/pth-dev/vtgtool.git
fi

cd /root/vtgtool

# 6. Setup environment
echo -e "${YELLOW}⚙️  Setting up environment...${NC}"
mkdir -p infra/envs
cp infra/envs/.env.dev.example infra/envs/.env.dev 2>/dev/null || true

# 7. Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

# 8. Start dev environment
echo -e "${YELLOW}▶️  Starting dev environment...${NC}"
./scripts/deploy.sh dev up

# 9. Wait for services
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 15

# 10. Check status
./scripts/deploy.sh dev status

echo ""
echo -e "${GREEN}✅ Dev Server Setup Complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Connect via VS Code Remote SSH"
echo "   2. Open folder: /root/vtgtool"
echo "   3. Edit code in packages/backend or packages/frontend"
echo "   4. Changes will hot reload automatically!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://YOUR_SERVER_IP:5173"
echo "   Backend:  http://YOUR_SERVER_IP:8000"
echo "   API Docs: http://YOUR_SERVER_IP:8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   ./scripts/deploy.sh dev logs     # View logs"
echo "   ./scripts/deploy.sh dev restart  # Restart services"
echo "   ./scripts/deploy.sh dev status   # Check status"
