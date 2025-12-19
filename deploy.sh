#!/bin/bash
# =============================================
# Quick Deployment Script
# =============================================

set -e

ENV=$1

if [ -z "$ENV" ]; then
    echo "Usage: ./deploy.sh [uat|production]"
    exit 1
fi

echo "🚀 Deploying to $ENV..."

# Navigate to infra directory
cd infra

# Copy appropriate .env file
if [ "$ENV" == "uat" ]; then
    cp .env.uat .env
    echo "✅ Using UAT configuration"
elif [ "$ENV" == "production" ]; then
    cp .env.prod .env
    echo "✅ Using Production configuration"
else
    echo "❌ Invalid environment. Use 'uat' or 'production'"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin $(git branch --show-current)

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start
echo "🏗️  Building and starting containers..."
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking health..."
if [ "$ENV" == "uat" ]; then
    curl -f http://localhost:8001/health || echo "⚠️  Backend health check failed"
else
    curl -f http://localhost:8000/health || echo "⚠️  Backend health check failed"
fi

echo "✅ Deployment complete!"
echo "📊 View logs: docker-compose logs -f"
