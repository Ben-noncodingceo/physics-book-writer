#!/bin/bash

# 部署验证和测试脚本
# 请按照以下步骤手动执行每个命令

set -e

echo "================================================"
echo "   AI LaTeX Book Generator - 部署验证测试      "
echo "================================================"
echo ""

echo "📋 步骤 1: 登录 Cloudflare"
echo "执行命令:"
echo "  wrangler login"
echo ""
echo "这将打开浏览器，请登录你的 Cloudflare 账户"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 2: 验证登录状态"
echo "执行命令:"
echo "  wrangler whoami"
echo ""
wrangler whoami
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 3: 运行数据库迁移"
echo "执行命令:"
echo "  wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql"
echo ""
wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql
echo ""
echo "✅ 数据库迁移完成"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 4: 验证数据库表"
echo "执行命令:"
echo "  wrangler d1 execute physics-book-writer-d1 --command=\"SELECT name FROM sqlite_master WHERE type='table';\""
echo ""
wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';"
echo ""
echo "应该看到: projects, outlines, chapter_contents, task_logs"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 5: 设置 Worker Secrets"
echo ""
echo "需要设置以下 secrets:"
echo "  1. CLAUDE_API_KEY"
echo "  2. OPENAI_API_KEY"
echo ""
read -p "是否现在设置? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    echo "设置 CLAUDE_API_KEY..."
    wrangler secret put CLAUDE_API_KEY
    echo ""
    echo "设置 OPENAI_API_KEY..."
    wrangler secret put OPENAI_API_KEY
    cd ..
    echo ""
    echo "✅ Secrets 设置完成"
else
    echo "跳过 Secrets 设置"
    echo "稍后可以手动设置:"
    echo "  cd backend"
    echo "  wrangler secret put CLAUDE_API_KEY"
    echo "  wrangler secret put OPENAI_API_KEY"
fi
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 6: 构建后端"
echo "执行命令:"
echo "  cd backend && npm ci && npm run build"
echo ""
cd backend
npm ci
npm run build
cd ..
echo ""
echo "✅ 后端构建完成"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 7: 部署后端到 Cloudflare Workers"
echo "执行命令:"
echo "  cd backend && wrangler deploy"
echo ""
cd backend
wrangler deploy
BACKEND_URL=$(wrangler deployments list --json | head -1)
cd ..
echo ""
echo "✅ 后端部署完成"
echo "🔗 Worker URL: https://physicsbookwriter.workers.dev"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 8: 测试后端 API"
echo "执行命令:"
echo "  curl https://physicsbookwriter.workers.dev/"
echo ""
curl https://physicsbookwriter.workers.dev/
echo ""
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 9: 构建前端"
echo "执行命令:"
echo "  cd frontend && npm ci && VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build"
echo ""
cd frontend
npm ci
VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build
cd ..
echo ""
echo "✅ 前端构建完成"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "📋 步骤 10: 部署前端到 Cloudflare Pages"
echo "执行命令:"
echo "  cd frontend && wrangler pages deploy dist --project-name=physics-book-writer"
echo ""
cd frontend
wrangler pages deploy dist --project-name=physics-book-writer
cd ..
echo ""
echo "✅ 前端部署完成"
echo ""
read -p "按回车键继续到下一步..."

echo ""
echo "================================================"
echo "           🎉 部署完成！                        "
echo "================================================"
echo ""
echo "📊 部署信息:"
echo "  • 后端 API: https://physicsbookwriter.workers.dev"
echo "  • 前端应用: https://physics-book-writer.pages.dev"
echo ""
echo "🧪 测试步骤:"
echo "  1. 访问前端 URL"
echo "  2. 检查是否能看到界面"
echo "  3. 尝试添加大纲项目"
echo "  4. 测试生成功能"
echo ""
echo "📝 后续步骤:"
echo "  1. 设置 GitHub Secrets 启用自动部署"
echo "  2. 配置自定义域名（可选）"
echo "  3. 查看部署日志: wrangler tail"
echo ""
echo "📖 详细文档:"
echo "  • GitHub 设置: docs/GITHUB_SETUP.md"
echo "  • API 文档: docs/API.md"
echo "  • 架构文档: docs/ARCHITECTURE.md"
echo ""
