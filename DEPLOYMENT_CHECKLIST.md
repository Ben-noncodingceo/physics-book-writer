# 🚀 部署验证清单

## 前置准备

- [ ] Node.js >= 18.0.0 已安装
- [ ] Wrangler CLI 已安装 (`npm install -g wrangler`)
- [ ] Cloudflare 账户已创建
- [ ] Claude API Key 已获取（可选）
- [ ] OpenAI API Key 已获取（可选）

## Cloudflare 资源配置

- [x] Worker 已创建: `physicsbookwriter`
- [x] D1 数据库已创建: `physics-book-writer-d1`
- [x] D1 Database ID: `0a09cf11-829c-46e8-8fde-b9946c73f1e7`
- [x] R2 存储桶已创建: `physics-book-writer`

## 本地配置

- [x] `backend/wrangler.toml` 已更新配置
- [x] GitHub Actions workflows 已创建
- [x] 前端环境变量文件已创建

## 部署步骤

### 步骤 1: 登录 Cloudflare

```bash
wrangler login
```

- [ ] 浏览器打开并成功登录
- [ ] 终端显示登录成功

### 步骤 2: 数据库迁移

```bash
wrangler d1 execute physics-book-writer-d1 --file=./migrations/001_init.sql
```

- [ ] 迁移成功执行
- [ ] 验证表已创建：
  ```bash
  wrangler d1 execute physics-book-writer-d1 --command="SELECT name FROM sqlite_master WHERE type='table';"
  ```
- [ ] 看到 4 个表：projects, outlines, chapter_contents, task_logs

### 步骤 3: 设置 Worker Secrets

```bash
cd backend
wrangler secret put CLAUDE_API_KEY
wrangler secret put OPENAI_API_KEY
cd ..
```

- [ ] CLAUDE_API_KEY 已设置
- [ ] OPENAI_API_KEY 已设置
- [ ] 验证 secrets：`wrangler secret list`

### 步骤 4: 部署后端

```bash
cd backend
npm ci
npm run build
wrangler deploy
cd ..
```

- [ ] 依赖安装成功
- [ ] 构建成功
- [ ] 部署成功
- [ ] 获得 Worker URL: `https://physicsbookwriter.workers.dev`

### 步骤 5: 测试后端 API

```bash
curl https://physicsbookwriter.workers.dev/
```

期望响应：
```json
{
  "name": "AI LaTeX Book Generator API",
  "version": "2.0.0",
  "status": "ok"
}
```

- [ ] API 响应正常
- [ ] 状态码 200

### 步骤 6: 部署前端

```bash
cd frontend
npm ci
VITE_API_URL=https://physicsbookwriter.workers.dev/api npm run build
wrangler pages deploy dist --project-name=physics-book-writer
cd ..
```

- [ ] 依赖安装成功
- [ ] 构建成功
- [ ] 部署成功
- [ ] 获得 Pages URL: `https://physics-book-writer.pages.dev`

### 步骤 7: 前端功能验证

访问: https://physics-book-writer.pages.dev

**基础功能：**
- [ ] 页面正常加载
- [ ] 没有控制台错误
- [ ] 看到项目标题

**大纲编辑器：**
- [ ] 能看到大纲编辑器区域
- [ ] "添加章节"按钮可点击
- [ ] 能添加新的章节项
- [ ] 能拖拽排序
- [ ] 双击可编辑标题
- [ ] 下拉菜单可更改层级
- [ ] 删除按钮工作正常

**LaTeX 头文件编辑器：**
- [ ] "LaTeX 头文件"按钮可点击
- [ ] 模态框正常打开
- [ ] 代码编辑器显示正常
- [ ] 预设按钮工作
- [ ] 保存功能正常

**生成面板：**
- [ ] 右侧面板显示
- [ ] "开始生成"按钮可见
- [ ] 导出按钮可见

### 步骤 8: API 功能测试

**测试项目创建：**
```bash
curl -X POST https://physicsbookwriter.workers.dev/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试项目",
    "config": {
      "difficulty": "undergraduate",
      "writingStyle": "academic",
      "customCommands": ["\\ex", "\\sol"],
      "language": "zh"
    }
  }'
```

- [ ] 返回创建的项目
- [ ] 包含项目 ID

**测试项目列表：**
```bash
curl https://physicsbookwriter.workers.dev/api/projects
```

- [ ] 返回项目数组
- [ ] 包含刚创建的项目

### 步骤 9: GitHub Actions 配置

**设置 GitHub Secrets：**

访问: https://github.com/Ben-noncodingceo/physics-book-writer/settings/secrets/actions

- [ ] 添加 `CLOUDFLARE_API_TOKEN`
- [ ] 添加 `CLOUDFLARE_ACCOUNT_ID`

**验证 workflows：**

- [ ] `.github/workflows/ci.yml` 存在
- [ ] `.github/workflows/deploy.yml` 存在

**测试自动部署：**

```bash
git add .
git commit -m "test: 测试自动部署"
git push origin claude/ai-latex-textbook-system-01LdgccNrsHWu3JUN8AstZVy
```

- [ ] GitHub Actions 开始运行
- [ ] CI workflow 成功
- [ ] Deploy workflow 成功

## 生产环境验证

### 性能测试

- [ ] 页面加载时间 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 图片加载正常

### 安全检查

- [ ] HTTPS 证书有效
- [ ] 没有控制台安全警告
- [ ] API Secrets 未暴露

### 功能完整性

- [ ] 所有路由可访问
- [ ] 表单提交正常
- [ ] 错误处理正确
- [ ] 404 页面正常

## 监控设置

- [ ] Cloudflare Analytics 已启用
- [ ] 告警规则已配置（可选）
- [ ] 日志记录正常工作

## 文档完整性

- [ ] README.md 更新
- [ ] API 文档准确
- [ ] 部署指南完整
- [ ] 故障排查指南可用

## 后续任务

- [ ] 配置自定义域名
- [ ] 设置 CDN 缓存策略
- [ ] 启用 Rate Limiting
- [ ] 配置 WAF 规则
- [ ] 设置备份策略
- [ ] 创建监控 Dashboard

## 快速命令参考

```bash
# 查看 Worker 日志
wrangler tail

# 查看部署历史
wrangler deployments list

# 查看 Pages 部署
wrangler pages deployment list --project-name=physics-book-writer

# 查看数据库
wrangler d1 execute physics-book-writer-d1 --command="SELECT * FROM projects;"

# 查看 Secrets
wrangler secret list

# 重新部署
./scripts/deploy.sh
```

## 问题记录

记录部署过程中遇到的问题和解决方案：

| 问题 | 解决方案 | 日期 |
|------|----------|------|
|      |          |      |

## 完成标志

- [ ] 所有核心功能验证通过
- [ ] 生产环境稳定运行
- [ ] 自动部署配置完成
- [ ] 团队成员已培训
- [ ] 文档已归档

---

**部署负责人**: _________________

**验证日期**: _________________

**签名**: _________________
