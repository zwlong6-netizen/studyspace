# StudySpace - 自习室预约系统

一个完整的自习室座位预约应用，包含 React 前端和 Express.js 后端，使用 Supabase 作为数据库。

## 🚀 快速开始

### 1. 配置 Supabase

1. 登录 [Supabase](https://supabase.com) 创建新项目
2. 在 Supabase SQL Editor 中执行 `supabase/schema.sql` 创建数据库表
3. 获取项目 URL 和 anon key

### 2. 配置后端环境变量

编辑 `backend/.env` 文件：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key
PORT=3001
```

### 3. 启动后端服务

```bash
cd backend
npm install  # 如果还没安装
npm run dev


cd /Users/zwl/Downloads/chrome_downloads/studyspace/backend && npm run dev
```

后端将运行在 http://localhost:3001

### 4. 启动前端

```bash
# 在项目根目录
npm install  # 如果还没安装
npm run dev

cd /Users/zwl/Downloads/chrome_downloads/studyspace && npm run dev
```

前端将运行在 http://localhost:5173

## 📁 项目结构

```
studyspace/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── index.ts        # Express 入口
│   │   ├── config/         # Supabase 配置
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 认证中间件
│   │   └── types/          # 类型定义
│   └── package.json
├── pages/                   # 前端页面
├── src/
│   └── services/api.ts     # API 服务层
├── supabase/
│   └── schema.sql          # 数据库初始化脚本
└── package.json
```

## 🔗 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/profile | 获取用户信息 |
| GET | /api/shops | 获取店铺列表 |
| GET | /api/shops/:id | 获取店铺详情 |
| GET | /api/seats | 获取座位列表 |
| GET | /api/seats/:id/schedule | 获取座位时间表 |
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 获取订单列表 |
| PATCH | /api/orders/:id | 更新订单状态 |

## 📝 注意事项

- 前端在 API 不可用时会自动 fallback 到默认数据
- 首次使用需要在 Supabase 中执行 SQL 脚本初始化数据库
- JWT token 存储在 localStorage 中
