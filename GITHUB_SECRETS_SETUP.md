# GitHub Secrets 设置指南

## ⚠️ 重要：必须设置这些 Secrets 才能自动部署

GitHub Actions 失败的原因是缺少认证信息。请按以下步骤设置：

## 第一步：获取 Cloudflare Account ID

1. 登录 https://dash.cloudflare.com
2. 在右侧边栏找到 **Account ID**
3. 复制这个 ID（格式类似：`1234567890abcdef1234567890abcdef`）

## 第二步：创建 Cloudflare API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Create Custom Token**
4. 配置如下：

   **Token name**: `GitHub Actions - Physics Book Writer`

   **Permissions**:
   ```
   Account | Workers Scripts | Edit
   Account | Cloudflare Pages | Edit
   Account | D1 | Edit
   Account | Workers R2 Storage | Edit
   ```

   **Account Resources**:
   ```
   Include | Your Account
   ```

   **Zone Resources**:
   ```
   Include | All zones
   ```

5. 点击 **Continue to summary**
6. 点击 **Create Token**
7. **⚠️ 立即复制 Token！离开页面后无法再次查看**

## 第三步：在 GitHub 仓库添加 Secrets

### 方法 A：通过 GitHub 网页界面

1. 打开您的 GitHub 仓库页面
2. 点击 **Settings** (设置)
3. 左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**

添加以下两个 secrets：

**Secret 1:**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: 粘贴您在第二步创建的 API Token

**Secret 2:**
- Name: `CLOUDFLARE_ACCOUNT_ID`
- Value: 粘贴您在第一步获取的 Account ID

### 方法 B：通过 GitHub CLI (如果已安装)

```bash
# 设置 API Token
gh secret set CLOUDFLARE_API_TOKEN

# 设置 Account ID
gh secret set CLOUDFLARE_ACCOUNT_ID
```

## 第四步：验证设置

1. 在 GitHub 仓库的 **Settings** → **Secrets and variables** → **Actions** 页面
2. 确认看到以下两个 secrets：
   - ✅ `CLOUDFLARE_API_TOKEN`
   - ✅ `CLOUDFLARE_ACCOUNT_ID`

## 第五步：触发 GitHub Actions

设置完 Secrets 后，GitHub Actions 会自动重新运行。您也可以：

1. 进入仓库的 **Actions** 标签页
2. 选择失败的 workflow
3. 点击 **Re-run all jobs**

## 验证部署成功

部署成功后，您会看到：

1. **GitHub Actions**: 所有步骤显示绿色 ✅
2. **Cloudflare Workers**: 在 https://dash.cloudflare.com → Workers & Pages → `physicsbookwriter`
3. **Cloudflare Pages**: 在 https://dash.cloudflare.com → Workers & Pages → `physics-book-writer`

## 常见问题

### Q: 找不到 Settings 选项卡？
A: 您可能没有仓库的管理员权限。请联系仓库所有者添加 Secrets。

### Q: API Token 权限不够？
A: 确保 Token 包含所有必需的权限（Workers Scripts, Pages, D1, R2 Storage）。

### Q: 设置了 Secrets 但仍然失败？
A:
1. 检查 Account ID 是否正确
2. 重新生成 API Token 确保权限正确
3. 查看 GitHub Actions 详细日志了解具体错误信息

## 下一步：设置 AI API Keys

部署成功后，还需要为 Worker 设置 AI API keys：

```bash
cd backend

# 设置 Gemini API Key
npx wrangler secret put GEMINI_API_KEY

# 设置通义千问 API Key
npx wrangler secret put TONGYI_API_KEY

# 设置 OpenAI API Key
npx wrangler secret put OPENAI_API_KEY
```

---

设置完成后，您的应用就可以完全自动部署了！🚀
