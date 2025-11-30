# 部署指南

本指南将帮助你将 AI LaTeX 书籍生成器部署到 Cloudflare。

## 前提条件

1. **Cloudflare 账户**
   - 注册 Cloudflare 账户：https://dash.cloudflare.com/sign-up
   - 验证邮箱

2. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **API Keys**
   - Claude API Key: https://console.anthropic.com/
   - OpenAI API Key: https://platform.openai.com/

## 第一步：创建 D1 数据库

1. 创建开发数据库：
   ```bash
   wrangler d1 create latex-book-db
   ```

2. 复制输出的 `database_id` 并更新 `backend/wrangler.toml`：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "latex-book-db"
   database_id = "YOUR_DATABASE_ID_HERE"
   ```

3. 创建生产数据库（可选）：
   ```bash
   wrangler d1 create latex-book-db-prod
   ```
   更新生产环境配置。

4. 运行数据库迁移：
   ```bash
   wrangler d1 execute latex-book-db --file=./migrations/001_init.sql
   ```

## 第二步：创建 R2 存储桶

1. 创建 R2 存储桶：
   ```bash
   wrangler r2 bucket create latex-files
   ```

2. 生产环境（可选）：
   ```bash
   wrangler r2 bucket create latex-files-prod
   ```

## 第三步：配置环境变量和密钥

1. 设置 API 密钥：
   ```bash
   # 设置 Claude API Key
   wrangler secret put CLAUDE_API_KEY
   # 输入你的 Claude API Key

   # 设置 OpenAI API Key
   wrangler secret put OPENAI_API_KEY
   # 输入你的 OpenAI API Key
   ```

2. 生产环境：
   ```bash
   wrangler secret put CLAUDE_API_KEY --env production
   wrangler secret put OPENAI_API_KEY --env production
   ```

## 第四步：部署后端

1. 构建后端：
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. 部署到 Cloudflare Workers：
   ```bash
   wrangler deploy
   ```

3. 记录 Worker URL（用于前端配置）：
   ```
   https://latex-book-generator.YOUR_SUBDOMAIN.workers.dev
   ```

## 第五步：部署前端

1. 更新前端环境变量：

   在 `frontend/` 目录创建 `.env.production`：
   ```env
   VITE_API_URL=https://latex-book-generator.YOUR_SUBDOMAIN.workers.dev/api
   ```

2. 构建前端：
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. 部署到 Cloudflare Pages：
   ```bash
   wrangler pages deploy dist --project-name=latex-book-generator-frontend
   ```

4. 或者通过 Cloudflare Dashboard：
   - 进入 Pages
   - 点击 "Create a project"
   - 连接 Git 仓库
   - 配置构建设置：
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: `frontend`

## 第六步：配置自定义域名（可选）

1. **前端域名**：
   - Pages > Settings > Custom domains
   - 添加你的域名

2. **后端域名**：
   - Workers > Settings > Triggers
   - 添加自定义域名

## 验证部署

1. 访问前端 URL
2. 创建新项目
3. 编辑大纲
4. 测试生成功能

## 使用一键部署脚本

```bash
# 从项目根目录运行
./scripts/deploy.sh
```

这将自动执行：
- 构建前端和后端
- 部署到 Cloudflare
- 运行数据库迁移

## 故障排查

### Worker 部署失败

1. 检查 `wrangler.toml` 配置
2. 验证 database_id 和 bucket 名称
3. 查看部署日志：`wrangler tail`

### 数据库连接失败

1. 确认数据库迁移已运行
2. 检查 database_id 配置
3. 验证数据库绑定名称（应为 "DB"）

### API 调用失败

1. 验证 API Keys 已设置：
   ```bash
   wrangler secret list
   ```

2. 检查 CORS 配置
3. 查看 Worker 日志

### 前端无法连接后端

1. 检查 `.env.production` 中的 API URL
2. 验证 CORS 配置
3. 检查网络请求（浏览器开发者工具）

## 成本估算

Cloudflare 提供慷慨的免费层级：

- **Workers**: 100,000 请求/天（免费）
- **D1**: 5GB 存储，500 万读取/天（免费）
- **R2**: 10GB 存储/月（免费）
- **Pages**: 无限请求（免费）

对于大多数使用场景，完全在免费层级内。

## 更新部署

```bash
# 更新后端
cd backend
npm run build
wrangler deploy

# 更新前端
cd frontend
npm run build
wrangler pages deploy dist
```

## 监控和日志

查看实时日志：
```bash
wrangler tail
```

查看分析数据：
- Cloudflare Dashboard > Workers & Pages > Analytics

## 安全建议

1. 定期轮换 API Keys
2. 启用 WAF 规则
3. 配置速率限制
4. 监控异常流量
5. 定期备份数据库

## 回滚部署

```bash
# 列出部署版本
wrangler deployments list

# 回滚到特定版本
wrangler rollback [deployment-id]
```
