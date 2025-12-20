#!/bin/bash
# =============================================
# VTG TOOL - Unified Deployment Script
# =============================================
# Usage: ./scripts/deploy.sh [dev|uat|prod] [command]
# Commands: up, down, restart, logs, status, build

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PROJECT_ROOT/infra"

# Parse arguments
ENV=${1:-dev}
COMMAND=${2:-up}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|uat|prod)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: ./scripts/deploy.sh [dev|uat|prod] [up|down|restart|logs|status|build]"
    exit 1
fi

# Set compose file and env file
COMPOSE_FILE="$INFRA_DIR/docker-compose.${ENV}.yml"
ENV_FILE="$INFRA_DIR/envs/.env.${ENV}"

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo -e "${RED}❌ Compose file not found: $COMPOSE_FILE${NC}"
    exit 1
fi

# Check if env file exists (except for dev which has defaults)
if [[ ! -f "$ENV_FILE" && "$ENV" != "dev" ]]; then
    echo -e "${YELLOW}⚠️  Env file not found: $ENV_FILE${NC}"
    echo "Creating from example..."
    cp "$INFRA_DIR/envs/.env.${ENV}.example" "$ENV_FILE" 2>/dev/null || true
fi

# Build docker compose command
if [[ -f "$ENV_FILE" ]]; then
    DC_CMD="docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"
else
    DC_CMD="docker compose -f $COMPOSE_FILE"
fi

echo -e "${BLUE}🚀 VTG Tool - $ENV Environment${NC}"
echo -e "${BLUE}   Compose: $COMPOSE_FILE${NC}"
echo ""

case $COMMAND in
    up)
        echo -e "${GREEN}▶️  Starting services...${NC}"
        $DC_CMD up -d --build
        echo ""
        echo -e "${GREEN}✅ Services started!${NC}"
        $DC_CMD ps
        ;;
    down)
        echo -e "${YELLOW}⏹️  Stopping services...${NC}"
        $DC_CMD down
        echo -e "${GREEN}✅ Services stopped!${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        $DC_CMD restart
        echo -e "${GREEN}✅ Services restarted!${NC}"
        ;;
    logs)
        $DC_CMD logs -f --tail=100
        ;;
    status)
        echo -e "${BLUE}📊 Service Status:${NC}"
        $DC_CMD ps
        echo ""
        echo -e "${BLUE}📊 Health Check:${NC}"
        if [[ "$ENV" == "dev" ]]; then
            curl -sf http://localhost:8000/health 2>/dev/null && echo "" || echo -e "${YELLOW}Backend not ready yet${NC}"
        elif [[ "$ENV" == "uat" ]]; then
            curl -sf http://localhost:8001/health 2>/dev/null && echo "" || echo -e "${YELLOW}Backend not ready yet${NC}"
        else
            curl -sf http://localhost:8000/health 2>/dev/null && echo "" || echo -e "${YELLOW}Backend not ready yet${NC}"
        fi
        ;;
    build)
        echo -e "${GREEN}🏗️  Building images...${NC}"
        $DC_CMD build --no-cache
        echo -e "${GREEN}✅ Build complete!${NC}"
        ;;
    shell-be)
        echo -e "${BLUE}🐚 Opening backend shell...${NC}"
        $DC_CMD exec backend bash
        ;;
    shell-fe)
        echo -e "${BLUE}🐚 Opening frontend shell...${NC}"
        $DC_CMD exec frontend sh
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo "Available commands: up, down, restart, logs, status, build, shell-be, shell-fe"
        exit 1
        ;;
esac
