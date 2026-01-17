# StudySpace 部署到 Vercel 指南

本文档详细介绍了如何将 StudySpace 项目（React 前端 + Express 后端 + Supabase）通过 Serverless 方式部署到 Vercel 平台。

## 1. 项目适配（已完成）

为了让 Express 后端能在 Vercel 的 Serverless 环境中运行，我们已经完成了以下代码修改：

- **合并依赖**：将 `backend/package.json` 中的依赖项（express, supabase-js 等）合并到了根目录的 `package.json` 中，确保 Vercel 能安装所有必要包。
- **Serverless 入口**：创建了 `api/index.ts`，作为 Vercel Functions 的入口文件。
- **路由配置**：添加了 `vercel.json`，将 `/api/*` 请求转发给后端函数，将其他请求转发给前端 `index.html`。
- **前端适配**：修改了 `src/services/api.ts`，将 API 基础路径设置为相对路径 `/api`，并更新了 `vite.config.ts` 以支持本地开发代理。

## 2. 准备工作

在部署之前，请确保你手头有以下环境变量的值（可以从 `backend/.env` 文件中复制）：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

## 3. 部署步骤

### 第一步：推送到 GitHub
确保你的所有修改都已经提交并推送到了 GitHub 仓库。

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 第二步：在 Vercel 创建项目
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)。
2. 点击 **Add New...** -> **Project**。
3. 连接你的 GitHub 账号，并找到 `studyspace` 仓库，点击 **Import**。

### 第三步：配置项目
在配置页面（Configure Project）：
- **Framework Preset**: Vercel 会自动识别为 **Vite**，保持默认即可。
- **Root Directory**: 保持默认（项目根目录）。
- **Build & Output Settings**: 保持默认。

**关键步骤：环境变量 (Environment Variables)**
展开 **Environment Variables** 选项卡，添加以下变量：

| Key (变量名) | Value (示例值，请填写真实值) |
| :--- | :--- |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | `your-supabase-anon-key` |
| `JWT_SECRET` | `your-jwt-secret` |

*注意：请使用你 `backend/.env` 中的真实值替换示例值。*

### 第四步：部署
点击 **Deploy** 按钮。Vercel 将开始构建前端并部署后端 API。如果不报错，等待约 1 分钟即可完成。

## 4. 验证部署

部署完成后，点击预览链接：
1. **测试前端**：页面应能正常加载。
2. **测试后端**：尝试**登录**或**注册**。如果成功，说明前端能正确连接到后端 API，且后端能连接到 Supabase 数据库。

## 5. 故障排查

- **登录报错 500 (Internal Server Error)**：
  - 原因：通常是环境变量缺失或错误。
  - 解决：进入 Vercel 项目设置 -> **Settings** -> **Environment Variables**，检查变量是否正确添加。修改后记得在 **Deployments** 页面点击 **Redeploy**。
  - 查看日志：点击 Functions 标签页，查看具体的报错堆栈。

- **登录报错 404 (Not Found)**：
  - 原因：`vercel.json` 路由配置未生效，或者 API 路径错误。
  - 解决：检查 git 仓库中是否包含 `vercel.json` 和 `api/index.ts`。

- **本地开发报错 (Connection Refused)**：
  - 解决：确保本地 `vite.config.ts` 中配置了 `proxy`，并且同时运行了前端 (`npm run dev`) 和后端服务。
