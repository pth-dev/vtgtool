#!/bin/bash
# =============================================
# Simple Deployment Script
# =============================================
# Usage: 
#   ./deploy.sh uat   # Deploy UAT (from uat branch)
#   ./deploy.sh prod  # Deploy Production (from main branch)

set -e

ENV=$1

if [ -z "$ENV" ]; then
    echo "Usage: ./deploy.sh [uat|prod]"
    exit 1
fi

# Determine compose file and env file
if [ "$ENV" == "uat" ]; then
    COMPOSE_FILE="infra/docker-compose.uat.yml"
    ENV_FILE="infra/.env.uat"
    BRANCH="uat"
    PORT=8001
elif [ "$ENV" == "prod" ]; then
    COMPOSE_FILE="infra/docker-compose.prod.yml"
    ENV_FILE="infra/.env.prod"
    BRANCH="main"
    PORT=8000
else
    echo "❌ Invalid environment. Use 'uat' or 'prod'"
    exit 1
fi

echo "🚀 Deploying $ENV..."

# Ensure correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "⚠️  Switching to $BRANCH branch..."
    git checkout $BRANCH
fi

# Pull latest code
echo "📥 Pulling latest from $BRANCH..."
git pull origin $BRANCH

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    echo "Please create it from infra/envs/.env.$ENV.example"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down || true

# Build and start
echo "🏗️  Building and starting..."
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d --build

# Wait and check health
echo "⏳ Waiting for services..."
sleep 15

echo "🏥 Health check..."
curl -sf http://localhost:$PORT/health && echo "✅ Healthy!" || echo "⚠️  Check logs"

# Show status
echo ""
docker compose -f $COMPOSE_FILE ps
echo ""
echo "✅ $ENV deployment complete!"
echo "📊 Logs: docker compose -f $COMPOSE_FILE logs -f"
