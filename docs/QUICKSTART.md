# 快速入门指南

本指南帮助你在 5 分钟内启动 AI LaTeX 书籍生成器。

## 前提条件

- Node.js >= 18.0.0
- npm >= 9.0.0
- Claude API Key 或 OpenAI API Key

## 步骤 1: 克隆和安装

```bash
# 克隆仓库
git clone <repository-url>
cd latex-book-generator

# 安装依赖
npm install
```

## 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的 API keys
# CLAUDE_API_KEY=your_api_key_here
# OPENAI_API_KEY=your_api_key_here
```

## 步骤 3: 本地开发（使用 Cloudflare）

### 3.1 设置 Wrangler

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 3.2 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create latex-book-db

# 复制输出的 database_id 到 backend/wrangler.toml
```

### 3.3 运行数据库迁移

```bash
# 应用数据库 schema
wrangler d1 execute latex-book-db --file=./migrations/001_init.sql
```

### 3.4 设置密钥

```bash
# 在本地开发中，可以创建 backend/.dev.vars 文件
cd backend
cat > .dev.vars << EOF
CLAUDE_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key
EOF
```

## 步骤 4: 启动开发服务器

### 方式 1: 同时启动前后端

```bash
# 从项目根目录
npm run dev
```

这将启动：
- 前端: http://localhost:5173
- 后端: http://localhost:8787

### 方式 2: 分别启动

```bash
# 终端 1 - 后端
cd backend
npm install
npm run dev

# 终端 2 - 前端
cd frontend
npm install
npm run dev
```

## 步骤 5: 使用应用

1. **打开浏览器**
   访问 http://localhost:5173

2. **创建项目**
   应用会自动创建一个演示项目

3. **编辑大纲**
   - 点击"添加章节"按钮
   - 拖拽调整顺序
   - 双击编辑标题
   - 使用下拉菜单更改层级

4. **配置 LaTeX 头文件**
   - 点击"LaTeX 头文件"按钮
   - 选择预设模板或自定义
   - 保存配置

5. **生成内容**
   - 点击右侧的"开始生成"按钮
   - 等待 AI 生成内容
   - 查看进度条

6. **导出**
   - 点击"导出 LaTeX"下载 .tex 文件
   - 使用 LaTeX 编译器编译成 PDF

## 常见问题

### Q: 前端无法连接后端

**A**: 检查：
1. 后端是否在 8787 端口运行
2. vite.config.ts 中的代理配置
3. 浏览器控制台的错误信息

### Q: AI 生成失败

**A**: 检查：
1. API Key 是否正确设置
2. 是否有足够的 API 额度
3. 网络连接是否正常
4. 后端日志中的错误信息

### Q: 数据库错误

**A**: 确保：
1. 数据库迁移已运行
2. database_id 配置正确
3. 使用 `wrangler d1 execute` 命令检查数据库

## 下一步

- 📖 阅读 [API 文档](API.md)
- 🏗️ 了解 [系统架构](ARCHITECTURE.md)
- 🚀 查看 [部署指南](DEPLOYMENT.md)

## 开发技巧

### 热重载

前后端都支持热重载，修改代码后自动刷新。

### 查看后端日志

```bash
# 在后端目录
wrangler dev
# 日志会实时显示在终端
```

### 调试前端

1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签的日志
3. 使用 Network 标签检查 API 请求

### 重置数据库

```bash
# 删除并重新创建数据库
wrangler d1 execute latex-book-db --command="DROP TABLE IF EXISTS projects; DROP TABLE IF EXISTS outlines; DROP TABLE IF EXISTS chapter_contents; DROP TABLE IF EXISTS task_logs;"

# 重新运行迁移
wrangler d1 execute latex-book-db --file=./migrations/001_init.sql
```

## 示例使用场景

### 创建物理教材

1. 创建项目"大学物理教程"
2. 添加大纲：
   ```
   - 第一章 力学
     - 1.1 牛顿运动定律
       - 1.1.1 第一定律
       - 1.1.2 第二定律
       - 1.1.3 第三定律
     - 1.2 动量守恒
   ```
3. 选择"物理模板"LaTeX 头文件
4. 生成内容
5. 导出并编译

### 自定义 LaTeX 命令

```latex
% 在 LaTeX 头文件编辑器中添加：
\newcommand{\important}[1]{\textbf{\textcolor{red}{#1}}}
\newcommand{\note}[1]{\textit{\textcolor{blue}{注：#1}}}

% 在生成的内容中使用：
\important{这是重要内容}
\note{这是一个注释}
```

## 获取帮助

- 🐛 报告问题: GitHub Issues
- 💬 讨论: GitHub Discussions
- 📧 联系: 项目维护者

## 许可证

MIT License - 详见 LICENSE 文件
