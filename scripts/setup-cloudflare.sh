#!/bin/bash

# Cloudflare 快速设置脚本
# 用于初始化 Cloudflare 资源和运行数据库迁移

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   AI LaTeX Book Generator - Cloudflare 设置    ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g wrangler${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Wrangler CLI 已安装${NC}"

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  未登录到 Cloudflare，开始登录流程...${NC}"
    wrangler login
else
    echo -e "${GREEN}✓ 已登录到 Cloudflare${NC}"
fi

echo ""
echo -e "${YELLOW}当前配置：${NC}"
echo "  Worker: physicsbookwriter"
echo "  D1 Database: physics-book-writer-d1"
echo "  D1 Database ID: 0a09cf11-829c-46e8-8fde-b9946c73f1e7"
echo "  R2 Bucket: physics-book-writer"
echo ""

# 询问是否运行数据库迁移
read -p "$(echo -e ${YELLOW}是否运行数据库迁移? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}正在运行数据库迁移...${NC}"

    if wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql; then
        echo -e "${GREEN}✓ 数据库迁移成功${NC}"

        echo -e "${BLUE}验证数据库表...${NC}"
        wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';"
    else
        echo -e "${YELLOW}⚠️  迁移可能已经运行过，跳过${NC}"
    fi
fi

echo ""

# 询问是否设置 Secrets
read -p "$(echo -e ${YELLOW}是否设置 Worker Secrets (API Keys)? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}设置 Claude API Key...${NC}"
    cd backend
    wrangler secret put CLAUDE_API_KEY

    echo -e "${BLUE}设置 OpenAI API Key...${NC}"
    wrangler secret put OPENAI_API_KEY
    cd ..

    echo -e "${GREEN}✓ Secrets 设置完成${NC}"
fi

echo ""

# 询问是否立即部署
read -p "$(echo -e ${YELLOW}是否立即部署到 Cloudflare? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}部署后端到 Cloudflare Workers...${NC}"
    cd backend
    npm ci
    npm run build
    wrangler deploy
    cd ..
    echo -e "${GREEN}✓ 后端部署成功${NC}"

    echo ""
    echo -e "${BLUE}部署前端到 Cloudflare Pages...${NC}"
    cd frontend
    npm ci
    VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build
    wrangler pages deploy dist --project-name=physics-book-writer
    cd ..
    echo -e "${GREEN}✓ 前端部署成功${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}           设置完成！                           ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}下一步：${NC}"
echo "1. 访问你的应用："
echo -e "   ${BLUE}https://physics-book-writer.pages.dev${NC}"
echo ""
echo "2. API 端点："
echo -e "   ${BLUE}https://physicsbookwriter.workers.dev${NC}"
echo ""
echo "3. 设置 GitHub Secrets 以启用自动部署："
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "   详见: docs/GITHUB_SETUP.md"
echo ""
echo -e "${YELLOW}监控日志：${NC}"
echo "  wrangler tail"
echo ""
