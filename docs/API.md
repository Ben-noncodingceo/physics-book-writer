# API 文档

## 基础信息

- **Base URL**: `https://your-worker.workers.dev/api`
- **Content-Type**: `application/json`
- **Authentication**: 目前无需认证（生产环境应添加）

## 项目 (Projects)

### 列出所有项目

```http
GET /api/projects
```

**响应**:
```json
[
  {
    "id": "abc123",
    "title": "物理学教材",
    "latex_header": "...",
    "config": "{...}",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 获取项目详情

```http
GET /api/projects/:id
```

**响应**:
```json
{
  "id": "abc123",
  "title": "物理学教材",
  "latex_header": "...",
  "config": "{...}",
  "status": "draft",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 创建项目

```http
POST /api/projects
```

**请求体**:
```json
{
  "title": "物理学教材",
  "latexHeader": "\\documentclass{book}...",
  "config": {
    "difficulty": "undergraduate",
    "writingStyle": "academic",
    "customCommands": ["\\ex", "\\sol"],
    "language": "zh"
  }
}
```

**响应**: 201 Created
```json
{
  "id": "abc123",
  "title": "物理学教材",
  ...
}
```

### 更新项目

```http
PUT /api/projects/:id
```

**请求体**:
```json
{
  "title": "更新的标题",
  "status": "generating"
}
```

### 删除项目

```http
DELETE /api/projects/:id
```

**响应**: 200 OK

## 大纲 (Outline)

### 获取项目大纲

```http
GET /api/projects/:id/outline
```

**响应**:
```json
[
  {
    "id": "outline1",
    "project_id": "abc123",
    "parent_id": null,
    "title": "第一章 力学基础",
    "level": "chapter",
    "sort_order": 0,
    "content_generated": 0,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 创建大纲项

```http
POST /api/projects/:id/outline/items
```

**请求体**:
```json
{
  "title": "牛顿运动定律",
  "level": "section",
  "parentId": "outline1",
  "sortOrder": 0
}
```

### 更新大纲项

```http
PUT /api/projects/:projectId/outline/items/:itemId
```

**请求体**:
```json
{
  "title": "更新的标题",
  "level": "subsection"
}
```

### 删除大纲项

```http
DELETE /api/projects/:projectId/outline/items/:itemId
```

### 重新排序大纲

```http
PUT /api/projects/:id/outline/reorder
```

**请求体**:
```json
{
  "updates": [
    {
      "itemId": "outline1",
      "parentId": null,
      "sortOrder": 0
    },
    {
      "itemId": "outline2",
      "parentId": "outline1",
      "sortOrder": 0
    }
  ]
}
```

## LaTeX 头文件

### 获取 LaTeX 头文件

```http
GET /api/projects/:id/latex-header
```

**响应**:
```json
{
  "content": "\\documentclass[12pt]{book}..."
}
```

### 更新 LaTeX 头文件

```http
PUT /api/projects/:id/latex-header
```

**请求体**:
```json
{
  "content": "\\documentclass[12pt]{book}..."
}
```

## 内容生成

### 开始生成内容

```http
POST /api/projects/:id/generate
```

**响应**: 200 OK
```json
{
  "message": "Content generation started"
}
```

### 获取生成的内容

```http
GET /api/content/:outlineId
```

**响应**:
```json
{
  "id": "content1",
  "outline_id": "outline1",
  "content": "\\section{...}...",
  "exercises": "[...]",
  "status": "completed",
  "word_count": 1500,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 导出

### 导出 LaTeX

```http
GET /api/projects/:id/export/latex
```

**响应**: LaTeX 文件下载

### 导出 PDF

```http
GET /api/projects/:id/export/pdf
```

**响应**: PDF 文件下载（未实现）

## WebSocket 事件

连接到 WebSocket：
```javascript
const socket = io('wss://your-ws-server');
```

### 加入项目房间

```javascript
socket.emit('join:project', projectId);
```

### 离开项目房间

```javascript
socket.emit('leave:project', projectId);
```

### 监听事件

#### 大纲更新

```javascript
socket.on('outline:update', (data) => {
  // data: { type, item, items }
});
```

#### 生成进度

```javascript
socket.on('generation:progress', (data) => {
  // data: { projectId, currentItem, totalItems, completedItems, status }
});
```

#### 任务日志

```javascript
socket.on('task:log', (data) => {
  // data: { id, projectId, role, action, content, metadata }
});
```

#### 内容生成完成

```javascript
socket.on('content:generated', (data) => {
  // data: ChapterContent
});
```

## 错误响应

所有错误响应格式：
```json
{
  "error": "Error message"
}
```

### HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求错误
- `404` - 未找到
- `500` - 服务器错误
- `501` - 未实现

## 速率限制

- 窗口：15 分钟
- 最大请求数：100 次/窗口

超出限制返回 `429 Too Many Requests`。

## 示例

### 完整工作流

```javascript
// 1. 创建项目
const project = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '量子力学导论',
    config: { difficulty: 'graduate', language: 'zh' }
  })
}).then(r => r.json());

// 2. 添加大纲
await fetch(`/api/projects/${project.id}/outline/items`, {
  method: 'POST',
  body: JSON.stringify({
    title: '第一章 波函数',
    level: 'chapter',
    sortOrder: 0
  })
});

// 3. 配置 LaTeX 头文件
await fetch(`/api/projects/${project.id}/latex-header`, {
  method: 'PUT',
  body: JSON.stringify({
    content: '\\documentclass{book}...'
  })
});

// 4. 开始生成
await fetch(`/api/projects/${project.id}/generate`, {
  method: 'POST'
});

// 5. 导出
const blob = await fetch(`/api/projects/${project.id}/export/latex`)
  .then(r => r.blob());
```
