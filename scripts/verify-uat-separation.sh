#!/bin/bash
# =============================================
# UAT Database Separation Verification Script
# =============================================
# Checks if UAT is properly separated from Production
#
# Usage:
#   chmod +x verify-uat-separation.sh
#   ./verify-uat-separation.sh

echo "🔍 UAT Database Separation Verification"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Docker containers
echo "1️⃣  Checking Docker containers..."
if docker ps | grep -q "vtg-db-uat"; then
    echo "   ✅ UAT PostgreSQL container is running (vtg-db-uat)"
else
    echo "   ❌ UAT PostgreSQL container NOT found!"
    echo "      Expected: vtg-db-uat"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Backend DATABASE_URL
echo "2️⃣  Checking Backend DATABASE_URL..."
DB_URL=$(docker exec vtg-backend env | grep DATABASE_URL || echo "")
if echo "$DB_URL" | grep -q "@db:5432/vtgtool_uat"; then
    echo "   ✅ Backend using UAT database"
    echo "      $DB_URL"
elif echo "$DB_URL" | grep -q "ondigitalocean.com"; then
    echo "   ❌ Backend using PRODUCTION database!"
    echo "      $DB_URL"
    echo "      ⚠️  THIS IS DANGEROUS! UAT should use local database!"
    ERRORS=$((ERRORS + 1))
else
    echo "   ⚠️  Unknown database URL:"
    echo "      $DB_URL"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 3: Environment
echo "3️⃣  Checking ENVIRONMENT variable..."
ENV=$(docker exec vtg-backend env | grep "^ENVIRONMENT=" | cut -d= -f2)
if [ "$ENV" = "staging" ] || [ "$ENV" = "uat" ]; then
    echo "   ✅ ENVIRONMENT=$ENV (correct for UAT)"
elif [ "$ENV" = "production" ]; then
    echo "   ⚠️  ENVIRONMENT=production"
    echo "      Should be 'staging' or 'uat' for UAT server"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ⚠️  ENVIRONMENT=$ENV (unknown)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: Database connectivity
echo "4️⃣  Checking database connectivity..."
if docker exec vtg-db-uat pg_isready -U vtg_uat > /dev/null 2>&1; then
    echo "   ✅ UAT database is accepting connections"
else
    echo "   ❌ UAT database is NOT ready"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 5: Database name
echo "5️⃣  Checking database name..."
DB_NAME=$(docker exec vtg-db-uat psql -U vtg_uat -t -c "SELECT current_database();" 2>/dev/null | xargs)
if [ "$DB_NAME" = "vtgtool_uat" ]; then
    echo "   ✅ Database name: $DB_NAME (correct)"
else
    echo "   ⚠️  Database name: $DB_NAME (expected: vtgtool_uat)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: .env configuration
echo "6️⃣  Checking .env configuration..."
if [ -f ".env" ]; then
    ENV_ENVIRONMENT=$(grep "^ENVIRONMENT=" .env | cut -d= -f2)
    ENV_IMAGE_TAG=$(grep "^IMAGE_TAG=" .env | cut -d= -f2)
    ENV_NGINX_CONFIG=$(grep "^NGINX_CONFIG=" .env | cut -d= -f2)
    
    echo "   ENVIRONMENT=$ENV_ENVIRONMENT"
    echo "   IMAGE_TAG=$ENV_IMAGE_TAG"
    echo "   NGINX_CONFIG=$ENV_NGINX_CONFIG"
    
    if [ "$ENV_ENVIRONMENT" = "staging" ] || [ "$ENV_ENVIRONMENT" = "uat" ]; then
        echo "   ✅ .env ENVIRONMENT is correct"
    else
        echo "   ⚠️  .env ENVIRONMENT should be 'staging' or 'uat'"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ "$ENV_IMAGE_TAG" = "uat" ]; then
        echo "   ✅ .env IMAGE_TAG is correct"
    else
        echo "   ⚠️  .env IMAGE_TAG should be 'uat'"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ⚠️  .env file not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 7: Docker compose files
echo "7️⃣  Checking docker-compose files..."
if [ -f "docker-compose.yml" ] && [ -f "docker-compose.uat.yml" ]; then
    echo "   ✅ Both docker-compose files exist"
else
    echo "   ❌ Missing docker-compose files"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 8: Test database query
echo "8️⃣  Testing database query..."
USER_COUNT=$(docker exec vtg-db-uat psql -U vtg_uat vtgtool_uat -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
if [ -n "$USER_COUNT" ]; then
    echo "   ✅ Database query successful"
    echo "      Users in UAT database: $USER_COUNT"
else
    echo "   ⚠️  Could not query database (may not be initialized yet)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "========================================"
echo "📊 VERIFICATION SUMMARY"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED!"
    echo ""
    echo "🎉 UAT is properly separated from Production"
    echo ""
    echo "Architecture:"
    echo "  UAT:        Frontend → Backend → PostgreSQL (LOCAL CONTAINER)"
    echo "  Production: Frontend → Backend → PostgreSQL (MANAGED DATABASE)"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  PASSED WITH WARNINGS"
    echo ""
    echo "Warnings: $WARNINGS"
    echo ""
    echo "UAT appears to be separated, but some configuration could be improved."
    echo "Review warnings above."
    echo ""
    exit 0
else
    echo "❌ VERIFICATION FAILED"
    echo ""
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    echo "🚨 UAT may still be using Production database!"
    echo ""
    echo "To fix, run:"
    echo "  ./scripts/setup-uat-db.sh"
    echo ""
    echo "Or follow manual steps in:"
    echo "  UAT_DATABASE_SEPARATION_GUIDE.md"
    echo ""
    exit 1
fi

