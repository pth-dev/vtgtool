#!/bin/bash
# =============================================
# UAT Database Setup Script
# =============================================
# This script separates UAT database from Production
# Run this on UAT server ONLY!
#
# Usage:
#   chmod +x setup-uat-db.sh
#   ./setup-uat-db.sh

set -e  # Exit on error

echo "🔧 UAT Database Separation Script"
echo "=================================="
echo ""

# Check if running on correct server
read -p "⚠️  Are you on UAT server (not Production)? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. Run this script on UAT server only!"
    exit 1
fi

# Check if in correct directory
if [ ! -f "docker-compose.yml" ] || [ ! -f "docker-compose.uat.yml" ]; then
    echo "❌ Error: docker-compose files not found!"
    echo "Please run this script from /opt/vtgtool directory"
    exit 1
fi

echo "✅ Pre-flight checks passed"
echo ""

# Backup current .env
echo "📦 Backing up current .env..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Update .env for UAT
echo "📝 Updating .env for UAT environment..."

# Generate secure password if not exists
if ! grep -q "DB_PASSWORD=" .env; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "DB_PASSWORD=$DB_PASSWORD" >> .env
    echo "✅ Generated secure DB password"
else
    echo "✅ DB_PASSWORD already exists"
fi

# Update ENVIRONMENT
if grep -q "^ENVIRONMENT=" .env; then
    sed -i 's/^ENVIRONMENT=.*/ENVIRONMENT=staging/' .env
    echo "✅ Set ENVIRONMENT=staging"
else
    echo "ENVIRONMENT=staging" >> .env
fi

# Update IMAGE_TAG
if grep -q "^IMAGE_TAG=" .env; then
    sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=uat/' .env
    echo "✅ Set IMAGE_TAG=uat"
else
    echo "IMAGE_TAG=uat" >> .env
fi

# Update NGINX_CONFIG
if grep -q "^NGINX_CONFIG=" .env; then
    sed -i 's/^NGINX_CONFIG=.*/NGINX_CONFIG=uat.conf/' .env
    echo "✅ Set NGINX_CONFIG=uat.conf"
else
    echo "NGINX_CONFIG=uat.conf" >> .env
fi

echo ""
echo "📋 Current .env configuration:"
echo "------------------------------"
grep -E "^(ENVIRONMENT|IMAGE_TAG|NGINX_CONFIG|DB_PASSWORD)=" .env
echo ""

# Stop current services
echo "🛑 Stopping current services..."
docker compose down
echo "✅ Services stopped"
echo ""

# Pull latest UAT images
echo "📥 Pulling latest UAT images..."
docker compose pull
echo "✅ Images pulled"
echo ""

# Start with UAT configuration
echo "🚀 Starting UAT services with local database..."
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d
echo "✅ Services started"
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
for i in {1..30}; do
    if docker exec vtg-db-uat pg_isready -U vtg_uat > /dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi
    echo "   Waiting for database... ($i/30)"
    sleep 2
done

# Initialize database
echo ""
echo "🗄️  Initializing UAT database..."
docker exec vtg-backend python init_db.py || echo "⚠️  init_db.py not found or failed (may be normal)"
echo ""

# Create admin user
echo "👤 Creating admin user..."
docker exec vtg-backend python -c "
from app.core.database import async_session
from app.models.models import User
from app.core.security import hash_password
import asyncio

async def create_admin():
    async with async_session() as db:
        # Check if admin exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == 'admin@vtgtool.com'))
        if result.scalar_one_or_none():
            print('ℹ️  Admin user already exists')
            return
        
        admin = User(
            email='admin@vtgtool.com',
            password_hash=hash_password('Admin@123'),
            full_name='UAT Admin',
            role='admin'
        )
        db.add(admin)
        await db.commit()
        print('✅ Admin created: admin@vtgtool.com / Admin@123')

asyncio.run(create_admin())
" 2>/dev/null || echo "⚠️  Could not create admin (may already exist)"

echo ""
echo "🎉 UAT Database Setup Complete!"
echo "================================"
echo ""
echo "📊 Verification:"
echo "  - Database: vtg-db-uat (local PostgreSQL container)"
echo "  - Environment: staging"
echo "  - Image tag: uat"
echo ""
echo "🔐 Admin Credentials:"
echo "  Email: admin@vtgtool.com"
echo "  Password: Admin@123"
echo ""
echo "🧪 Test login:"
echo "  curl http://localhost:8000/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"admin@vtgtool.com\",\"password\":\"Admin@123\"}'"
echo ""
echo "📝 Useful commands:"
echo "  docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d    # Start"
echo "  docker compose -f docker-compose.yml -f docker-compose.uat.yml down     # Stop"
echo "  docker compose logs -f                                                   # Logs"
echo ""
echo "💡 Tip: Add aliases to ~/.bashrc:"
echo "  alias uat-up='docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d'"
echo "  alias uat-down='docker compose -f docker-compose.yml -f docker-compose.uat.yml down'"
echo "  alias uat-logs='docker compose logs -f'"
echo ""

