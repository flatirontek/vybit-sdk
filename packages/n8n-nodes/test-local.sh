#!/bin/bash
set -e

echo "🧪 Testing @vybit/n8n-nodes-vybit locally with Docker"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi

# Build the package
echo -e "${BLUE}📦 Building package...${NC}"
npm run build

# Stop existing container if running
if docker ps -a | grep -q n8n-vybit-test; then
  echo -e "${YELLOW}🛑 Stopping existing test container...${NC}"
  docker compose -f docker-compose.test.yml down
fi

# Build the package tarball
echo -e "${BLUE}📦 Packaging for n8n...${NC}"
npm pack

# Start n8n
echo -e "${BLUE}🚀 Starting n8n with Vybit node...${NC}"
docker compose -f docker-compose.test.yml up -d

echo ""
echo -e "${GREEN}✅ n8n is starting up!${NC}"
echo ""
echo "📍 Access n8n at: http://localhost:5678"
echo ""
echo "🔍 To view logs:"
echo "   docker logs -f n8n-vybit-test"
echo ""
echo "🛑 To stop:"
echo "   docker compose -f docker-compose.test.yml down"
echo ""
echo "⏳ Waiting for n8n to be ready (this may take 30-60 seconds)..."

# Wait for n8n to be ready
for i in {1..30}; do
  if curl -s http://localhost:5678 > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}🎉 n8n is ready! Opening in browser...${NC}"
    sleep 2
    open http://localhost:5678
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo -e "${YELLOW}⚠️  n8n is taking longer than expected. Check logs:${NC}"
echo "   docker logs n8n-vybit-test"
