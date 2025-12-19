#!/bin/bash
# =============================================
# VTG TOOL - Setup Script cho môi trường mới
# =============================================

set -e  # Exit on error

echo "🚀 VTG Tool - Environment Setup Script"
echo "======================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if environment parameter provided
if [ -z "$1" ]; then
    print_error "Usage: ./setup-env.sh [development|uat|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "uat" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment. Choose: development, uat, or production"
    exit 1
fi

print_info "Setting up environment: $ENVIRONMENT"

# =============================================
# 1. Generate SECRET_KEY
# =============================================
echo ""
echo "📝 Step 1: Generating SECRET_KEY..."

SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
print_success "SECRET_KEY generated: $SECRET_KEY"

# =============================================
# 2. Setup Backend Environment
# =============================================
echo ""
echo "📝 Step 2: Setting up Backend environment file..."

cd packages/backend

if [ "$ENVIRONMENT" == "development" ]; then
    ENV_FILE=".env"
    TEMPLATE=".env.example"
elif [ "$ENVIRONMENT" == "uat" ]; then
    ENV_FILE=".env"
    TEMPLATE=".env.uat"
else
    ENV_FILE=".env"
    TEMPLATE=".env.prod"
fi

if [ -f "$ENV_FILE" ]; then
    print_info "$ENV_FILE already exists. Creating backup..."
    cp $ENV_FILE "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
fi

cp $TEMPLATE $ENV_FILE
print_success "Created $ENV_FILE from $TEMPLATE"

# Replace SECRET_KEY in .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" $ENV_FILE
else
    # Linux
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" $ENV_FILE
fi

print_success "SECRET_KEY configured in $ENV_FILE"

cd ../..

# =============================================
# 3. Setup Docker Compose Environment
# =============================================
echo ""
echo "📝 Step 3: Setting up Docker Compose environment..."

cd infra

if [ "$ENVIRONMENT" == "uat" ]; then
    DOCKER_ENV=".env.uat"
elif [ "$ENVIRONMENT" == "production" ]; then
    DOCKER_ENV=".env.prod"
else
    print_info "Skipping Docker Compose setup for development"
    cd ..
    echo ""
    print_success "✅ Development environment setup complete!"
    print_info "Next steps:"
    echo "  1. Review packages/backend/.env and update database credentials"
    echo "  2. Start PostgreSQL and Redis locally"
    echo "  3. Run: cd packages/backend && uvicorn main:app --reload"
    echo "  4. Run: cd packages/frontend && npm run dev"
    exit 0
fi

if [ -f ".env" ]; then
    print_info ".env already exists. Creating backup..."
    cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
fi

cp $DOCKER_ENV .env
print_success "Created .env from $DOCKER_ENV"

# Replace SECRET_KEY in Docker .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
else
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" .env
fi

print_success "SECRET_KEY configured in infra/.env"

cd ..

# =============================================
# 4. Create necessary directories
# =============================================
echo ""
echo "📝 Step 4: Creating required directories..."

mkdir -p packages/backend/logs
mkdir -p packages/backend/uploads
if [ "$ENVIRONMENT" == "uat" ]; then
    mkdir -p packages/backend/uploads_uat
fi

print_success "Directories created"

# =============================================
# 5. Security reminders
# =============================================
echo ""
echo "🔐 Security Checklist:"
echo "====================="
print_info "[ ] Review and update database passwords in .env files"
print_info "[ ] Never commit .env files to git"
print_info "[ ] Use different SECRET_KEY for each environment"
print_info "[ ] Enable SSL/HTTPS in production"
print_info "[ ] Setup firewall rules"
print_info "[ ] Configure backup strategy"

# =============================================
# Summary
# =============================================
echo ""
echo "✅ Environment setup complete for: $ENVIRONMENT"
echo "================================================"
echo ""

if [ "$ENVIRONMENT" == "uat" ]; then
    print_info "UAT Environment configured"
    echo "Next steps:"
    echo "  1. Review infra/.env and update passwords"
    echo "  2. Review packages/backend/.env"
    echo "  3. Configure DNS: uat.vtgtool.help → server IP"
    echo "  4. Deploy: cd infra && docker-compose up -d"
    echo "  5. Check health: curl https://uat.vtgtool.help/api/health"
elif [ "$ENVIRONMENT" == "production" ]; then
    print_info "Production Environment configured"
    echo "Next steps:"
    echo "  1. ⚠️  CRITICAL: Review ALL passwords in .env files"
    echo "  2. Configure DNS: vtgtool.help → server IP"
    echo "  3. Setup SSL certificates (Let's Encrypt)"
    echo "  4. Configure monitoring & alerting"
    echo "  5. Setup database backups"
    echo "  6. Deploy: cd infra && docker-compose up -d"
    echo "  7. Check health: curl https://vtgtool.help/api/health"
fi

echo ""
print_success "🎉 Setup complete! Happy coding!"
