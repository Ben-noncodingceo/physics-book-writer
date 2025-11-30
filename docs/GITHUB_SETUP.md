# GitHub 自动部署设置指南

本指南将帮助你配置 GitHub Actions 自动部署到 Cloudflare。

## 第一步：获取 Cloudflare API Token

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角的头像 → "My Profile"
3. 左侧菜单选择 "API Tokens"
4. 点击 "Create Token"
5. 选择 "Edit Cloudflare Workers" 模板，或创建自定义 token

### 自定义 Token 权限设置

如果创建自定义 token，需要以下权限：

**Account 权限：**
- `Account:Cloudflare Pages:Edit`
- `Account:D1:Edit`
- `Account:Workers R2 Storage:Edit`

**Zone 权限：**
- `Zone:Workers Routes:Edit`
- `Zone:Workers Scripts:Edit`

6. 点击 "Continue to summary"
7. 点击 "Create Token"
8. **复制生成的 token**（只会显示一次）

## 第二步：获取 Cloudflare Account ID

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择任意域名
3. 右侧找到 "Account ID"，点击复制

或者在终端运行：
```bash
wrangler whoami
```

## 第三步：设置 GitHub Secrets

1. 访问你的 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"

添加以下 secrets：

### 必需的 Secrets

**1. CLOUDFLARE_API_TOKEN**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: 粘贴在第一步获取的 API Token

**2. CLOUDFLARE_ACCOUNT_ID**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: 粘贴在第二步获取的 Account ID

### 可选的 Secrets（用于 AI 功能）

**3. CLAUDE_API_KEY**
- Name: `CLAUDE_API_KEY`
- Value: 你的 Anthropic Claude API Key
- 获取地址: https://console.anthropic.com/

**4. OPENAI_API_KEY**
- Name: `OPENAI_API_KEY`
- Value: 你的 OpenAI API Key
- 获取地址: https://platform.openai.com/

## 第四步：设置 Cloudflare Workers Secrets

在终端运行以下命令设置 Workers secrets：

```bash
# 进入 backend 目录
cd backend

# 设置 Claude API Key
wrangler secret put CLAUDE_API_KEY
# 输入你的 Claude API Key

# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY
# 输入你的 OpenAI API Key
```

## 第五步：运行数据库迁移

在本地运行数据库迁移：

```bash
# 确保在项目根目录
wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql
```

验证迁移成功：

```bash
# 列出所有表
wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';"
```

应该看到：
- projects
- outlines
- chapter_contents
- task_logs

## 第六步：配置 Cloudflare Pages

### 方式 1: 通过 GitHub Actions 自动部署（推荐）

GitHub Actions 会自动部署，无需额外配置。

### 方式 2: 手动连接 GitHub 仓库

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. 点击 "Create a project"
3. 选择 "Connect to Git"
4. 授权 GitHub 访问
5. 选择你的仓库
6. 配置构建设置：
   - **Project name**: `physics-book-writer`
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `cd frontend && npm ci && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/`

7. 添加环境变量：
   - `VITE_API_URL`: `https://physicsbookwriter.workers.dev/api`
   - `VITE_WS_URL`: `wss://physicsbookwriter.workers.dev`

8. 点击 "Save and Deploy"

## 第七步：触发首次部署

### 方式 1: 推送代码到 main 分支

```bash
git add .
git commit -m "配置自动部署"
git push origin main
```

### 方式 2: 手动运行 GitHub Actions

1. 访问仓库的 "Actions" 标签
2. 选择 "Deploy to Cloudflare" workflow
3. 点击 "Run workflow"
4. 选择分支
5. 点击 "Run workflow"

## 第八步：验证部署

### 检查 Workers 部署

```bash
# 列出所有 Workers
wrangler deployments list

# 测试 API
curl https://physicsbookwriter.workers.dev/
```

应该返回：
```json
{
  "name": "AI LaTeX Book Generator API",
  "version": "2.0.0",
  "status": "ok"
}
```

### 检查 Pages 部署

1. 访问 Cloudflare Pages Dashboard
2. 找到 `physics-book-writer` 项目
3. 查看部署历史和状态
4. 点击部署 URL 访问前端

## 故障排查

### GitHub Actions 失败

1. **检查 Secrets 配置**
   - 确保 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 已设置
   - Token 权限是否正确

2. **查看错误日志**
   - 访问 Actions 标签
   - 点击失败的 workflow
   - 展开失败的步骤查看详细错误

3. **常见错误**

   **错误**: `Error: No account ID provided`
   **解决**: 检查 `CLOUDFLARE_ACCOUNT_ID` secret 是否设置

   **错误**: `Error: Authentication error`
   **解决**: 重新生成 API Token，确保权限正确

   **错误**: `Error: Database not found`
   **解决**: 检查 `wrangler.toml` 中的 database_id 是否正确

### Workers 部署成功但 API 返回错误

1. **检查 Secrets**
   ```bash
   wrangler secret list
   ```
   应该看到 `CLAUDE_API_KEY` 和 `OPENAI_API_KEY`

2. **查看 Worker 日志**
   ```bash
   wrangler tail
   ```

3. **测试数据库连接**
   ```bash
   wrangler d1 execute physics-book-writer-d1 --command="SELECT * FROM projects LIMIT 1;"
   ```

### Pages 部署失败

1. **检查构建日志**
   - Cloudflare Pages Dashboard
   - 点击失败的部署
   - 查看构建日志

2. **本地测试构建**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```

3. **检查环境变量**
   - Pages Dashboard → Settings → Environment variables
   - 确保 `VITE_API_URL` 设置正确

## 自动部署工作流程

推送代码后，会自动执行以下流程：

1. **CI 检查**（所有分支）
   - 代码类型检查
   - 构建测试

2. **部署 Backend**（main 和 claude/** 分支）
   - 构建 Workers
   - 部署到 Cloudflare

3. **部署 Frontend**（main 和 claude/** 分支）
   - 构建 React 应用
   - 部署到 Cloudflare Pages

4. **数据库迁移**（仅 main 分支）
   - 运行 SQL 迁移
   - 更新数据库 schema

## 监控和日志

### 实时查看 Worker 日志

```bash
wrangler tail
```

### 查看特定请求日志

```bash
wrangler tail --format=pretty
```

### 检查部署状态

```bash
# Workers
wrangler deployments list

# Pages
wrangler pages deployment list --project-name=physics-book-writer
```

## 下一步

- ✅ 配置自定义域名
- ✅ 设置 Cloudflare Analytics
- ✅ 配置 WAF 规则
- ✅ 启用 Rate Limiting

## 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
