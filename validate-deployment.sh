#!/bin/bash
# ============================================
# ARKIFLO - Deployment Validation Script
# Run this after deployment to verify everything works
# ============================================

echo "🔍 ARKIFLO Deployment Validation"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2"
        ((FAIL++))
    fi
}

echo "1. Checking Docker services..."
echo "------------------------------"

# Check MongoDB
docker ps | grep -q arkiflo_mongo
check $? "MongoDB container running"

# Check Backend
docker ps | grep -q arkiflo_backend
check $? "Backend container running"

# Check Frontend
docker ps | grep -q arkiflo_frontend
check $? "Frontend container running"

echo ""
echo "2. Checking service health..."
echo "-----------------------------"

# MongoDB health
docker exec arkiflo_mongo mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
check $? "MongoDB responding to ping"

# Backend health
curl -sf http://localhost:8001/api/health > /dev/null 2>&1
check $? "Backend API health check"

# Frontend health
curl -sf http://localhost:80 > /dev/null 2>&1
check $? "Frontend responding"

echo ""
echo "3. Checking volumes..."
echo "----------------------"

docker volume ls | grep -q arkiflo_mongo_data
check $? "MongoDB data volume exists"

docker volume ls | grep -q arkiflo_uploads
check $? "Uploads volume exists"

docker volume ls | grep -q arkiflo_backups
check $? "Backups volume exists"

echo ""
echo "4. Checking backend can access MongoDB..."
echo "-----------------------------------------"

# Try to hit an API that requires DB
RESPONSE=$(curl -s http://localhost:8001/api/health)
if echo "$RESPONSE" | grep -q "healthy"; then
    check 0 "Backend connected to MongoDB"
else
    check 1 "Backend connected to MongoDB"
fi

echo ""
echo "=================================="
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Deployment successful.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Review the output above.${NC}"
    echo "Run 'docker compose logs' for more details."
    exit 1
fi
