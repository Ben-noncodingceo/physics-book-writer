# 故障排查指南

## GitHub Actions 部署失败但 Cloudflare 显示成功

如果您遇到这种情况，请按以下步骤排查：

### 1. 查看详细错误日志

在 GitHub Actions 中点击失败的步骤，查看完整的错误输出。常见错误类型：

#### 错误类型 A: API Token 权限不足
```
Error: Authentication error
Error: You do not have permission to access this resource
```

**解决方案**: 重新创建 API Token，确保包含所有必需权限：
- Workers Scripts: Edit
- Cloudflare Pages: Edit
- D1: Edit
- Workers R2 Storage: Edit

#### 错误类型 B: Pages 项目不存在
```
Error: Project not found: physics-book-writer
```

**解决方案**: 在 Cloudflare Dashboard 手动创建 Pages 项目：
1. Workers & Pages → Create → Pages → Connect to Git (或 Direct Upload)
2. 项目名称: `physics-book-writer`

#### 错误类型 C: 构建产物路径错误
```
Error: Directory not found: dist
```

**解决方案**: 检查构建步骤是否成功完成。

### 2. 本地测试部署

在本地测试部署以验证配置正确：

```bash
# 测试后端部署
cd backend
npm install
npm run build
npx wrangler deploy

# 测试前端部署
cd ../frontend
npm install
npm run build
npx wrangler pages deploy dist --project-name=physics-book-writer
```

如果本地部署成功，说明配置正确，GitHub Actions 的问题可能是权限或环境变量。

### 3. 验证数据库自动初始化

部署成功后，访问您的 Worker URL 来触发数据库初始化：

```bash
curl https://physicsbookwriter.workers.dev/
```

应该返回：
```json
{
  "name": "AI LaTeX Book Generator API",
  "version": "2.0.0",
  "status": "ok",
  "database": {
    "healthy": true,
    "tables": ["projects", "outlines", "chapter_contents", "task_logs"]
  }
}
```

如果 `database.healthy` 为 `false`，检查 Worker 日志：

```bash
cd backend
npx wrangler tail
```

### 4. 检查 Cloudflare 部署状态

#### Worker (Backend)
1. 访问 https://dash.cloudflare.com
2. Workers & Pages → `physicsbookwriter`
3. 检查:
   - ✅ 最近部署时间
   - ✅ Production routes (如果有域名)
   - ✅ Settings → Variables 中的绑定 (DB, BUCKET)

#### Pages (Frontend)
1. Workers & Pages → `physics-book-writer`
2. 检查:
   - ✅ 部署历史
   - ✅ Production URL: `physics-book-writer.pages.dev`
   - ✅ 构建配置

### 5. GitHub Actions 特定问题

#### 问题: "The process '/opt/hostedtoolcache/node/18.20.8/x64/bin/npx' failed with exit code 1"

这是一个通用错误。需要查看该步骤的详细日志才能确定具体原因。

**排查步骤**:
1. 展开失败的部署步骤
2. 查找实际的 Wrangler 错误信息
3. 常见原因:
   - API Token 过期或权限不足
   - Account ID 不正确
   - Cloudflare 资源不存在 (Worker/Pages/D1/R2)
   - 网络超时

#### 问题: 部署成功但 GitHub Actions 仍显示失败

可能原因:
- Wrangler 返回了非零退出码但部署实际成功
- GitHub Actions 超时
- 后续验证步骤失败

**解决方案**: 如果 Cloudflare 显示部署成功且功能正常，可以忽略 GitHub Actions 的错误状态。

### 6. 常见解决方案总结

| 问题 | 解决方案 |
|-----|---------|
| API Token 权限不足 | 重新创建 Token，确保所有权限 |
| Account ID 错误 | 在 Cloudflare Dashboard 右侧边栏复制正确的 ID |
| Pages 项目不存在 | 在 Cloudflare Dashboard 手动创建项目 |
| 数据库未初始化 | 访问 Worker URL 触发自动初始化 |
| Worker Secrets 未设置 | 使用 `wrangler secret put` 设置 AI API keys |
| GitHub Actions 超时 | 增加 timeout 或本地部署 |

### 7. 获取帮助

如果以上步骤都无法解决问题，请提供：

1. **GitHub Actions 完整错误日志**（展开失败步骤的输出）
2. **Cloudflare Dashboard 截图**（显示 Worker 和 Pages 状态）
3. **本地部署结果**（`wrangler deploy` 的输出）

## 自动部署流程图

```
Git Push → GitHub Actions
    ↓
构建 Backend
    ↓
部署到 Cloudflare Workers
    ↓
Worker 启动 → 自动初始化数据库
    ↓
构建 Frontend
    ↓
部署到 Cloudflare Pages
    ↓
✅ 部署完成
```

## 测试清单

部署后请验证：

- [ ] Worker 可访问: `https://physicsbookwriter.workers.dev/`
- [ ] 数据库健康检查通过
- [ ] Pages 可访问: `https://physics-book-writer.pages.dev/`
- [ ] Frontend 可以连接到 Backend API
- [ ] AI API Keys 已设置
- [ ] 可以创建新项目
- [ ] 可以生成内容

---

更新时间: 2025-12-01
