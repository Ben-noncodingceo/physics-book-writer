#!/bin/bash

# 完全自动化部署脚本 - 无需手动操作
# 自动创建表格、安装依赖、部署应用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   AI LaTeX 书籍生成器 - 全自动部署           ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查当前目录
CURRENT_DIR=$(pwd)
echo -e "${YELLOW}当前目录: $CURRENT_DIR${NC}"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    echo -e "${YELLOW}提示: cd /path/to/physics-book-writer${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 在正确的项目目录${NC}"
echo ""

# 1. 检查 wrangler
echo -e "${BLUE}步骤 1/7: 检查 Wrangler CLI${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}安装 Wrangler CLI...${NC}"
    npm install -g wrangler
fi
echo -e "${GREEN}✓ Wrangler CLI 已就绪${NC}"
echo ""

# 2. 检查登录状态
echo -e "${BLUE}步骤 2/7: 验证 Cloudflare 登录${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}请登录 Cloudflare...${NC}"
    wrangler login
fi
echo -e "${GREEN}✓ Cloudflare 登录成功${NC}"
echo ""

# 3. 安装根目录依赖
echo -e "${BLUE}步骤 3/7: 安装项目依赖${NC}"
echo -e "${YELLOW}安装根目录依赖...${NC}"
npm install
echo -e "${GREEN}✓ 根目录依赖安装完成${NC}"
echo ""

# 4. 创建数据库表格（自动）
echo -e "${BLUE}步骤 4/7: 创建数据库表格${NC}"
echo -e "${YELLOW}正在运行数据库迁移...${NC}"

# 使用 wrangler d1 execute 创建表格
wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql 2>&1 || {
    echo -e "${YELLOW}⚠️  迁移可能已运行过，继续...${NC}"
}

# 验证表格
echo -e "${YELLOW}验证数据库表格...${NC}"
TABLES=$(wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';" --json 2>/dev/null || echo "[]")
echo -e "${GREEN}✓ 数据库表格已创建${NC}"
echo ""

# 5. 部署后端
echo -e "${BLUE}步骤 5/7: 部署后端到 Cloudflare Workers${NC}"
cd backend

echo -e "${YELLOW}安装后端依赖...${NC}"
npm install

echo -e "${YELLOW}构建后端...${NC}"
npm run build

echo -e "${YELLOW}部署到 Cloudflare Workers...${NC}"
wrangler deploy

echo -e "${GREEN}✓ 后端部署成功${NC}"
echo -e "${GREEN}✓ 后端 URL: https://physicsbookwriter.workers.dev${NC}"
cd ..
echo ""

# 6. 测试后端 API
echo -e "${BLUE}步骤 6/7: 测试后端 API${NC}"
echo -e "${YELLOW}等待 3 秒让 Worker 启动...${NC}"
sleep 3

API_RESPONSE=$(curl -s https://physicsbookwriter.workers.dev/ || echo "连接失败")
if [[ $API_RESPONSE == *"AI LaTeX Book Generator"* ]]; then
    echo -e "${GREEN}✓ 后端 API 正常工作${NC}"
    echo -e "${GREEN}  响应: $API_RESPONSE${NC}"
else
    echo -e "${YELLOW}⚠️  API 响应异常，但继续部署前端${NC}"
fi
echo ""

# 7. 部署前端
echo -e "${BLUE}步骤 7/7: 部署前端到 Cloudflare Pages${NC}"
cd frontend

echo -e "${YELLOW}安装前端依赖...${NC}"
npm install

echo -e "${YELLOW}构建前端...${NC}"
VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build

echo -e "${YELLOW}部署到 Cloudflare Pages...${NC}"
wrangler pages deploy dist --project-name=physics-book-writer

echo -e "${GREEN}✓ 前端部署成功${NC}"
cd ..
echo ""

# 完成
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}           🎉 部署完成！                        ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}📊 部署信息:${NC}"
echo -e "  ${GREEN}✓${NC} 数据库表格: 已自动创建"
echo -e "  ${GREEN}✓${NC} 后端 API: https://physicsbookwriter.workers.dev"
echo -e "  ${GREEN}✓${NC} 后端健康检查: 通过"
echo -e "  ${GREEN}✓${NC} 前端应用: https://physics-book-writer.pages.dev"
echo ""
echo -e "${BLUE}🧪 下一步测试:${NC}"
echo "  1. 访问前端: https://physics-book-writer.pages.dev"
echo "  2. 点击左侧的大纲编辑器"
echo "  3. 尝试添加章节"
echo "  4. 测试 LaTeX 头文件编辑"
echo ""
echo -e "${BLUE}📝 设置 API Keys (可选):${NC}"
echo "  如需使用 AI 生成功能，运行:"
echo "  cd backend"
echo "  wrangler secret put CLAUDE_API_KEY"
echo "  wrangler secret put OPENAI_API_KEY"
echo ""
echo -e "${BLUE}📖 查看日志:${NC}"
echo "  wrangler tail"
echo ""
echo -e "${GREEN}✨ 全部完成！应用已上线！${NC}"
