# 手动部署指南

## 快速部署命令

按顺序执行以下命令完成部署：

### 1. 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，登录你的 Cloudflare 账户。

### 2. 验证登录

```bash
wrangler whoami
```

应该显示你的账户信息。

### 3. 运行数据库迁移

```bash
wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql
```

### 4. 验证数据库

```bash
wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';"
```

应该显示：`projects`, `outlines`, `chapter_contents`, `task_logs`

### 5. 设置 API Secrets

```bash
cd backend

# 设置 Claude API Key
wrangler secret put CLAUDE_API_KEY
# 输入你的 API key

# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY
# 输入你的 API key

cd ..
```

### 6. 部署后端

```bash
cd backend
npm ci
npm run build
wrangler deploy
cd ..
```

### 7. 测试后端

```bash
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

### 8. 部署前端

```bash
cd frontend
npm ci
VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build
wrangler pages deploy dist --project-name=physics-book-writer
cd ..
```

### 9. 访问应用

部署完成后，访问：
- **前端**: https://physics-book-writer.pages.dev
- **API**: https://physicsbookwriter.workers.dev/api

## 一键部署脚本

如果你想自动执行所有步骤，运行：

```bash
./scripts/deploy-and-verify.sh
```

## 验证清单

部署完成后，验证以下功能：

- [ ] 访问前端 URL，页面正常加载
- [ ] 能够看到"物理学教材"演示项目
- [ ] 点击"LaTeX 头文件"按钮，模态框正常打开
- [ ] 点击"添加章节"，能够添加新的大纲项
- [ ] 大纲项目可以拖拽排序
- [ ] 双击标题可以编辑
- [ ] 右侧面板显示正常

## 常见问题

### Q: 迁移失败 - 表已存在

这是正常的，说明迁移之前已经运行过。可以忽略。

### Q: 部署时提示找不到数据库

检查 `backend/wrangler.toml` 中的 `database_id` 是否正确：
```toml
database_id = "0a09cf11-829c-46e8-8fde-b9946c73f1e7"
```

### Q: API 调用返回 500 错误

1. 检查是否设置了 Secrets：
   ```bash
   cd backend
   wrangler secret list
   ```

2. 查看 Worker 日志：
   ```bash
   wrangler tail
   ```

### Q: 前端无法连接后端

1. 检查环境变量是否正确设置
2. 查看浏览器控制台的网络请求
3. 确认后端已成功部署

## 监控部署

### 实时查看 Worker 日志

```bash
cd backend
wrangler tail
```

### 查看部署历史

```bash
# Workers
cd backend
wrangler deployments list

# Pages
cd frontend
wrangler pages deployment list --project-name=physics-book-writer
```

### 回滚部署

如果部署出现问题，可以回滚到之前的版本：

```bash
# 列出部署历史
wrangler deployments list

# 回滚到特定版本
wrangler rollback [deployment-id]
```

## 更新部署

当代码有更新时，重新部署：

```bash
# 后端
cd backend
npm run build
wrangler deploy
cd ..

# 前端
cd frontend
npm run build
wrangler pages deploy dist --project-name=physics-book-writer
cd ..
```

## GitHub Actions 自动部署

设置完成后，推送代码即可自动部署：

```bash
git add .
git commit -m "更新代码"
git push origin main
```

详细设置步骤见：[GitHub Setup Guide](GITHUB_SETUP.md)

## 下一步

- ✅ 配置自定义域名
- ✅ 设置 Cloudflare Analytics
- ✅ 启用 WAF 规则
- ✅ 配置 Rate Limiting
- ✅ 设置告警通知
