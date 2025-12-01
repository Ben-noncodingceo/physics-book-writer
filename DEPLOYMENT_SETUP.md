# Deployment Setup Guide

## GitHub Secrets Configuration

为了让 GitHub Actions 自动部署到 Cloudflare，您需要在 GitHub 仓库中设置以下 Secrets：

### 必需的 GitHub Secrets

1. **CLOUDFLARE_API_TOKEN**
   - 在 Cloudflare Dashboard → My Profile → API Tokens
   - 点击 "Create Token"
   - 使用 "Edit Cloudflare Workers" 模板
   - 确保包含以下权限：
     - Account - Cloudflare Pages: Edit
     - Account - D1: Edit
     - User - Workers Scripts: Edit
     - Account - Workers R2 Storage: Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - 在 Cloudflare Dashboard 的右侧边栏可以找到
   - 格式类似: `1234567890abcdef1234567890abcdef`

### 如何添加 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加上述两个 secrets

## Cloudflare Workers Secrets（AI API Keys）

在设置完 GitHub Secrets 后，您还需要为 Cloudflare Worker 设置 AI API keys。有两种方式：

### 方式 1: 使用 Wrangler CLI (推荐)

```bash
cd backend

# 设置 Gemini API Key
npx wrangler secret put GEMINI_API_KEY

# 设置通义千问 API Key
npx wrangler secret put TONGYI_API_KEY

# 设置 OpenAI API Key
npx wrangler secret put OPENAI_API_KEY
```

### 方式 2: 通过 Cloudflare Dashboard

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages**
3. 找到 `physicsbookwriter` worker
4. 点击 **Settings** → **Variables**
5. 在 **Environment Variables** 部分添加以下 secrets：
   - `GEMINI_API_KEY`
   - `TONGYI_API_KEY`
   - `OPENAI_API_KEY`

## 验证部署

### 1. 检查 GitHub Actions

推送代码后，在 GitHub 仓库的 **Actions** 标签页查看工作流运行状态。

### 2. 检查 Cloudflare Worker

```bash
# 查看 worker 状态
npx wrangler deployments list

# 查看 worker 日志
npx wrangler tail
```

### 3. 检查 Cloudflare Pages

前端会自动部署到 Cloudflare Pages，项目名称为 `physics-book-writer`。

在 Cloudflare Dashboard → **Workers & Pages** → **physics-book-writer** 可以查看部署状态和访问 URL。

## 数据库迁移

数据库迁移只在合并到 `main` 分支时自动运行。如果需要手动运行：

```bash
cd backend
npx wrangler d1 execute physics-book-writer-d1 --file=../migrations/001_init.sql
```

## 常见问题

### GitHub Actions 失败: "Error: The process '/opt/hostedtoolcache/node/18.20.8/x64/bin/npx' failed"

**原因**: 缺少 GitHub Secrets 或 API Token 权限不足

**解决方案**:
1. 确认已设置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`
2. 确认 API Token 有正确的权限
3. 重新生成 API Token 并更新 GitHub Secret

### Worker 部署成功但运行时错误

**原因**: 缺少 AI API Keys

**解决方案**: 使用上述方式设置 Worker Secrets

### Pages 部署失败

**原因**: Pages 项目未创建或名称不匹配

**解决方案**:
1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 项目名称必须是 `physics-book-writer`
3. 或修改 `.github/workflows/deploy.yml` 中的项目名称

## 自动部署流程

一旦设置完成，自动部署流程为：

1. **开发**: 在 `claude/**` 分支上开发
2. **推送**: `git push` 会触发 GitHub Actions
3. **构建**: 自动构建前端和后端
4. **部署**: 自动部署到 Cloudflare
5. **测试**: 访问部署的 URL 测试功能

不需要手动操作！🎉
