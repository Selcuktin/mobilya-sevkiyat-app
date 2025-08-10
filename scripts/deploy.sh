#!/bin/bash

# Production deployment script for Sevkiyat System

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

echo -e "${BLUE}Deployment Environment: ${DEPLOY_ENV}${NC}"

# Pre-deployment checks
echo -e "\n${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if required environment variables are set
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Environment variables check passed${NC}"

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check npm version
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm version: ${NPM_VERSION}${NC}"

# Install dependencies
echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
npm ci --only=production
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Run security audit
echo -e "\n${YELLOW}🔒 Running security audit...${NC}"
npm audit --audit-level high
echo -e "${GREEN}✅ Security audit passed${NC}"

# Run tests
echo -e "\n${YELLOW}🧪 Running tests...${NC}"
npm run test
echo -e "${GREEN}✅ Tests passed${NC}"

# Type checking
echo -e "\n${YELLOW}📝 Running type check...${NC}"
npm run type-check
echo -e "${GREEN}✅ Type check passed${NC}"

# Linting
echo -e "\n${YELLOW}🔍 Running linter...${NC}"
npm run lint
echo -e "${GREEN}✅ Linting passed${NC}"

# Create backup
echo -e "\n${YELLOW}💾 Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
if [ "$DEPLOY_ENV" = "production" ]; then
    npm run db:backup
    echo -e "${GREEN}✅ Database backup created${NC}"
fi

# Database migration
echo -e "\n${YELLOW}🗄️ Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Database migrations completed${NC}"

# Generate Prisma client
echo -e "\n${YELLOW}⚙️ Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Build application
echo -e "\n${YELLOW}🏗️ Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Application built successfully${NC}"

# Initialize system
echo -e "\n${YELLOW}🔧 Initializing system...${NC}"
node scripts/init-system.js
echo -e "${GREEN}✅ System initialized${NC}"

# Health check
echo -e "\n${YELLOW}🏥 Running health check...${NC}"
if [ "$DEPLOY_ENV" = "production" ]; then
    # Wait for application to start
    sleep 10
    
    # Check if health endpoint responds
    if curl -f -s "${NEXTAUTH_URL}/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        exit 1
    fi
fi

# Performance test (optional)
if [ "$2" = "--with-load-test" ]; then
    echo -e "\n${YELLOW}⚡ Running performance test...${NC}"
    npm run test:load:light
    echo -e "${GREEN}✅ Performance test completed${NC}"
fi

# Cleanup
echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
# Remove old backups (keep last 5)
if [ -d "./backups" ]; then
    ls -t ./backups | tail -n +6 | xargs -r rm -rf
fi
echo -e "${GREEN}✅ Cleanup completed${NC}"

# Success message
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${BLUE}📊 Deployment Summary:${NC}"
echo -e "   Environment: ${DEPLOY_ENV}"
echo -e "   Node.js: ${NODE_VERSION}"
echo -e "   Build: ✅ Success"
echo -e "   Tests: ✅ Passed"
echo -e "   Database: ✅ Migrated"
echo -e "   Health: ✅ OK"

if [ "$DEPLOY_ENV" = "production" ]; then
    echo -e "\n${YELLOW}🔗 Application URLs:${NC}"
    echo -e "   Main: ${NEXTAUTH_URL}"
    echo -e "   Health: ${NEXTAUTH_URL}/api/health"
    echo -e "   Dashboard: ${NEXTAUTH_URL}/dashboard"
fi

echo -e "\n${GREEN}✨ Ready to serve users!${NC}"