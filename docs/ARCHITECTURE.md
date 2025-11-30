# 系统架构文档

## 概述

AI LaTeX 书籍生成器是一个基于 Cloudflare 全栈的应用程序，使用 React 前端和 Cloudflare Workers 后端，通过 AI 自动生成大学级别的 LaTeX 教材。

## 技术架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面                              │
│                    (Cloudflare Pages)                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 大纲编辑器    │  │ LaTeX编辑器  │  │  生成面板     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  React 18 + TypeScript + Zustand + Tailwind CSS            │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API / WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API 层 (Hono)                             │
│                 (Cloudflare Workers)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 项目路由      │  │  生成路由     │  │  WebSocket   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Database │  │   AI     │  │ Storage  │
│ (D1)     │  │ Service  │  │  (R2)    │
│          │  │          │  │          │
│ SQLite   │  │ Claude   │  │ LaTeX    │
│          │  │ OpenAI   │  │ Files    │
└──────────┘  └──────────┘  └──────────┘
```

## 前端架构

### 目录结构

```
frontend/
├── src/
│   ├── components/       # React 组件
│   │   ├── OutlineEditor.tsx
│   │   ├── OutlineTreeNode.tsx
│   │   ├── LatexHeaderEditor.tsx
│   │   ├── ProjectHeader.tsx
│   │   └── GenerationPanel.tsx
│   ├── stores/          # Zustand 状态管理
│   │   ├── projectStore.ts
│   │   └── uiStore.ts
│   ├── services/        # API 和 WebSocket 服务
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/           # 工具函数
│       └── helpers.ts
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

### 状态管理

使用 Zustand 进行状态管理，分为两个主要 store：

1. **projectStore** - 项目数据状态
   - 当前项目
   - 大纲结构
   - 生成进度

2. **uiStore** - UI 状态
   - 侧边栏状态
   - 模态框状态
   - 通知管理

### 组件层次

```
App
├── ProjectHeader
│   └── 工具栏按钮
├── OutlineEditor
│   └── OutlineTreeNode (递归)
│       ├── 拖拽手柄
│       ├── 标题编辑
│       └── 层级选择器
├── GenerationPanel
│   ├── 生成按钮
│   ├── 进度条
│   └── 导出按钮
└── LatexHeaderEditor (模态框)
    ├── 预设按钮
    └── 代码编辑器
```

## 后端架构

### 目录结构

```
backend/
├── src/
│   ├── routes/          # API 路由
│   │   ├── projects.ts
│   │   └── generation.ts
│   ├── services/        # 业务逻辑
│   │   ├── ai.ts
│   │   └── latex.ts
│   ├── models/          # 数据模型
│   │   └── database.ts
│   ├── types.ts         # TypeScript 类型
│   └── index.ts         # 入口文件
├── wrangler.toml        # Cloudflare 配置
├── package.json
└── tsconfig.json
```

### 数据流

```
HTTP 请求
    ↓
Hono Router
    ↓
路由处理器
    ↓
数据库操作 / AI 服务
    ↓
响应返回
```

### AI 服务架构

```
AIService
├── generateChapterContent()
│   ├── buildPrompt()        # 构建 AI 提示
│   ├── callClaude()         # 调用 Claude API
│   └── extractExercises()   # 提取习题
└── researchTopic()          # 主题研究
```

## 数据库架构

### ER 图

```
┌─────────────┐
│  projects   │
├─────────────┤
│ id (PK)     │
│ title       │
│ latex_header│
│ config      │
│ status      │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐
│  outlines   │
├─────────────┤
│ id (PK)     │
│ project_id  │──┐
│ parent_id   │──┘ 自引用
│ title       │
│ level       │
│ sort_order  │
└──────┬──────┘
       │ 1:1
       ▼
┌──────────────────┐
│ chapter_contents │
├──────────────────┤
│ id (PK)          │
│ outline_id       │
│ content          │
│ exercises        │
│ status           │
└──────────────────┘
```

### 索引策略

- `idx_outlines_project_id` - 按项目查询大纲
- `idx_outlines_parent_id` - 查询子项目
- `idx_outlines_sort_order` - 排序优化
- `idx_chapter_contents_outline_id` - 内容查询

## AI 工作流

### 内容生成流程

```
1. 用户触发生成
    ↓
2. 更新项目状态为 "generating"
    ↓
3. 获取所有大纲项
    ↓
4. 对每个大纲项：
    a. 构建生成上下文
    b. 调用 Claude API
    c. 解析生成结果
    d. 提取习题
    e. 保存到数据库
    f. 记录任务日志
    ↓
5. 更新项目状态为 "completed"
    ↓
6. 通过 WebSocket 通知前端
```

### AI 提示工程

每个大纲项的提示包含：
- 标题和层级信息
- 父级章节上下文
- 难度和风格要求
- LaTeX 格式规范
- 例题要求
- 内容长度指导

## LaTeX 生成

### 文档结构

```latex
\documentclass{book}

% 用户自定义头文件
[CUSTOM_HEADER]

\begin{document}

\title{[PROJECT_TITLE]}
\maketitle
\tableofcontents

% 章节内容
\chapter{...}
  \section{...}
    \subsection{...}

% 生成的内容
[GENERATED_CONTENT]

\end{document}
```

### 层级映射

```
Database Level  →  LaTeX Command
─────────────────────────────────
chapter         →  \chapter{}
section         →  \section{}
subsection      →  \subsection{}
```

## 实时通信

### WebSocket 事件

#### 客户端 → 服务器
- `join:project` - 加入项目房间
- `leave:project` - 离开项目房间

#### 服务器 → 客户端
- `outline:update` - 大纲更新
- `generation:progress` - 生成进度
- `task:log` - 任务日志
- `content:generated` - 内容生成完成

## 存储架构

### Cloudflare R2

```
latex-files/
├── projects/
│   └── {project_id}/
│       ├── source.tex
│       ├── compiled.pdf
│       └── assets/
│           └── figures/
└── temp/
    └── {session_id}/
```

## 安全性

### 输入验证
- 所有 API 输入使用 Zod 验证
- LaTeX 代码注入防护
- SQL 注入防护（参数化查询）

### 速率限制
- 15 分钟窗口
- 每 IP 最多 100 次请求

### 数据隔离
- 项目级别的访问控制（待实现）
- 用户认证（待实现）

## 性能优化

### 前端
- 代码分割
- 懒加载组件
- React.memo 优化
- Zustand 细粒度订阅

### 后端
- D1 索引优化
- 批量数据库操作
- R2 缓存策略
- Worker 边缘缓存

### AI 调用
- 请求去重
- 结果缓存
- 并行生成（待实现）

## 可扩展性

### 水平扩展
- Cloudflare Workers 自动扩展
- D1 自动分片
- R2 无限存储

### 功能扩展点
1. 添加新的 AI 提供商
2. 自定义 LaTeX 模板
3. 多语言支持
4. 协作编辑
5. 版本控制

## 监控和日志

### 日志级别
- `info` - 一般信息
- `warn` - 警告
- `error` - 错误
- `debug` - 调试信息

### 监控指标
- API 响应时间
- AI 调用成功率
- 数据库查询性能
- Worker 执行时间

## 部署策略

### 环境
- `development` - 本地开发
- `staging` - 测试环境（待配置）
- `production` - 生产环境

### CI/CD
- GitHub Actions（待配置）
- 自动测试
- 自动部署
- 回滚策略

## 未来规划

1. **实时协作**
   - 多用户同时编辑
   - 冲突解决
   - 操作历史

2. **增强的 AI 功能**
   - 自动图表生成
   - 参考文献管理
   - 智能审阅

3. **PDF 编译**
   - 云端 LaTeX 编译
   - 实时预览
   - 错误诊断

4. **用户系统**
   - 认证和授权
   - 项目共享
   - 权限管理
