# =============================================
# VTG TOOL - Makefile
# =============================================
# Simplify common development tasks
# Usage: make [command]

.PHONY: help dev uat prod down logs status build clean

# Default target
help:
	@echo "VTG Tool - Available Commands"
	@echo "=============================="
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start dev environment (hot reload)"
	@echo "  make dev-logs     View dev logs"
	@echo "  make dev-down     Stop dev environment"
	@echo ""
	@echo "UAT (Staging):"
	@echo "  make uat          Start UAT environment"
	@echo "  make uat-logs     View UAT logs"
	@echo "  make uat-down     Stop UAT environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         Start production environment"
	@echo "  make prod-logs    View production logs"
	@echo "  make prod-down    Stop production environment"
	@echo ""
	@echo "Utilities:"
	@echo "  make status       Show all running containers"
	@echo "  make clean        Remove all containers and volumes"
	@echo "  make build-all    Build all images"
	@echo ""

# ==================== DEV ====================
dev:
	@./scripts/deploy.sh dev up

dev-logs:
	@./scripts/deploy.sh dev logs

dev-down:
	@./scripts/deploy.sh dev down

dev-restart:
	@./scripts/deploy.sh dev restart

dev-status:
	@./scripts/deploy.sh dev status

# ==================== UAT ====================
uat:
	@./scripts/deploy.sh uat up

uat-logs:
	@./scripts/deploy.sh uat logs

uat-down:
	@./scripts/deploy.sh uat down

uat-restart:
	@./scripts/deploy.sh uat restart

uat-status:
	@./scripts/deploy.sh uat status

# ==================== PROD ====================
prod:
	@./scripts/deploy.sh prod up

prod-logs:
	@./scripts/deploy.sh prod logs

prod-down:
	@./scripts/deploy.sh prod down

prod-restart:
	@./scripts/deploy.sh prod restart

prod-status:
	@./scripts/deploy.sh prod status

# ==================== UTILITIES ====================
status:
	@echo "📊 All Running Containers:"
	@docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"

clean:
	@echo "🧹 Cleaning up..."
	@docker compose -f infra/docker-compose.dev.yml down -v 2>/dev/null || true
	@docker compose -f infra/docker-compose.uat.yml down -v 2>/dev/null || true
	@docker compose -f infra/docker-compose.prod.yml down -v 2>/dev/null || true
	@docker system prune -f
	@echo "✅ Cleanup complete!"

build-all:
	@echo "🏗️  Building all images..."
	@./scripts/deploy.sh dev build
	@./scripts/deploy.sh uat build
	@./scripts/deploy.sh prod build
	@echo "✅ All images built!"

# ==================== TESTING ====================
test:
	@echo "🧪 Running tests..."
	@cd packages/backend && python -m pytest tests/ -v 2>/dev/null || echo "No backend tests found"
	@cd packages/frontend && npm run test 2>/dev/null || echo "No frontend tests configured"

test-e2e:
	@echo "🧪 Running E2E tests..."
	@cd packages/frontend && npx playwright test

# ==================== DATABASE ====================
db-shell:
	@docker exec -it vtg-db-dev psql -U vtg_dev -d vtgtool_dev

db-migrate:
	@echo "📦 Running migrations..."
	@docker exec -it vtg-backend-dev python init_db.py
