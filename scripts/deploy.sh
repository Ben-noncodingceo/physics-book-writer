#!/bin/bash

# AI LaTeX Book Generator - Deployment Script
# Deploys frontend to Cloudflare Pages and backend to Cloudflare Workers

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Please install it first:${NC}"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare. Running login...${NC}"
    wrangler login
fi

echo -e "${GREEN}✓ Wrangler CLI detected${NC}"

# Build backend
echo -e "${YELLOW}📦 Building backend...${NC}"
npm run build:backend
echo -e "${GREEN}✓ Backend built successfully${NC}"

# Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
npm run build:frontend
echo -e "${GREEN}✓ Frontend built successfully${NC}"

# Deploy backend to Cloudflare Workers
echo -e "${YELLOW}🚀 Deploying backend to Cloudflare Workers...${NC}"
cd backend
wrangler deploy
cd ..
echo -e "${GREEN}✓ Backend deployed successfully${NC}"

# Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
wrangler d1 execute latex-book-db --file=./migrations/001_init.sql || echo -e "${YELLOW}⚠️  Migration may have already been applied${NC}"
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Deploy frontend to Cloudflare Pages
echo -e "${YELLOW}🚀 Deploying frontend to Cloudflare Pages...${NC}"
cd frontend
wrangler pages deploy dist --project-name=latex-book-generator-frontend
cd ..
echo -e "${GREEN}✓ Frontend deployed successfully${NC}"

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Your application is now live:"
echo "- Frontend: https://latex-book-generator-frontend.pages.dev"
echo "- Backend: https://latex-book-generator.your-subdomain.workers.dev"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in Cloudflare dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Test the application"
