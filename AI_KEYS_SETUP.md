# 🔑 AI API Keys 设置指南

本项目支持三种 AI 服务，你已经设置的 keys 会被自动使用。

## 支持的 AI 服务

### 1. Google Gemini（推荐）

**获取方式：**
- 访问：https://makersuite.google.com/app/apikey
- 使用 Google 账号登录
- 点击 "Create API Key"
- 复制 API Key

**免费额度：**
- 每月 60 次免费请求
- 足够测试使用

**设置命令：**
```bash
cd backend
wrangler secret put GEMINI_API_KEY
# 粘贴你的 Gemini API Key
```

---

### 2. 阿里云通义千问

**获取方式：**
- 访问：https://dashscope.console.aliyun.com/
- 登录阿里云账号
- 开通 DashScope 服务
- 创建 API Key

**免费额度：**
- 新用户有免费额度
- 适合中文内容生成

**设置命令：**
```bash
cd backend
wrangler secret put TONGYI_API_KEY
# 粘贴你的通义千问 API Key
```

---

### 3. OpenAI

**获取方式：**
- 访问：https://platform.openai.com/api-keys
- 登录/注册 OpenAI 账号
- 点击 "Create new secret key"
- 复制 API Key

**费用：**
- 需要充值使用
- GPT-4 Turbo 成本较高

**设置命令：**
```bash
cd backend
wrangler secret put OPENAI_API_KEY
# 粘贴你的 OpenAI API Key
```

---

## 🎯 AI 使用优先级

系统会按以下优先级自动选择：

1. **Gemini**（如果设置了）
2. **通义千问**（如果设置了）
3. **OpenAI**（如果设置了）

**容错机制：** 如果主要的 AI 失败，会自动尝试其他可用的 AI。

---

## ✅ 验证设置

设置完成后，查看已配置的 secrets：

```bash
cd backend
wrangler secret list
```

应该看到：
```
GEMINI_API_KEY
TONGYI_API_KEY
OPENAI_API_KEY
```

---

## 🚀 部署应用

设置完 API Keys 后，运行：

```bash
cd /Users/sunpeng/Downloads/physics-book-writer-002
./scripts/auto-deploy.sh
```

---

## 💡 推荐配置

### 方案 A：免费测试（推荐新用户）
```bash
# 只设置 Gemini（免费）
wrangler secret put GEMINI_API_KEY
```

### 方案 B：中文优化
```bash
# Gemini + 通义千问
wrangler secret put GEMINI_API_KEY
wrangler secret put TONGYI_API_KEY
```

### 方案 C：全功能
```bash
# 三个都设置（最佳容错）
wrangler secret put GEMINI_API_KEY
wrangler secret put TONGYI_API_KEY
wrangler secret put OPENAI_API_KEY
```

---

## 🔍 常见问题

**Q: 必须设置所有三个吗？**
A: 不需要，至少设置一个即可。建议至少设置 Gemini（免费）。

**Q: 哪个质量最好？**
A: OpenAI GPT-4 质量最高，但收费。Gemini 和通义千问免费且质量也不错。

**Q: API Key 会过期吗？**
A: 不会自动过期，但如果账户余额不足或违反使用政策可能失效。

**Q: 如何修改已设置的 Key？**
A: 重新运行 `wrangler secret put` 命令即可覆盖。

**Q: 忘记设置了哪些 Key？**
A: 运行 `wrangler secret list` 查看。

---

## 📊 成本估算

生成一本 10 章的物理教材：

| AI 服务 | 预估成本 | 质量 |
|---------|---------|------|
| Gemini | 免费（额度内） | ⭐⭐⭐⭐ |
| 通义千问 | 免费/低成本 | ⭐⭐⭐⭐ |
| OpenAI GPT-4 | $3-5 | ⭐⭐⭐⭐⭐ |

---

## ⚙️ 已经设置好的用户

如果你已经设置了 Gemini、通义千问和 OpenAI 的 keys，直接运行：

```bash
cd /Users/sunpeng/Downloads/physics-book-writer-002
git pull
./scripts/auto-deploy.sh
```

系统会自动使用你设置的 API Keys！
