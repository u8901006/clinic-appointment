# 診所 LINE 預約系統

## 專案結構

- `apps/server` - Express.js 後端 API
- `apps/web` - React 管理後台
- `prisma` - 資料庫 Schema

## 本地開發

### 環境需求

- Node.js 20+
- PostgreSQL 15+

### 安裝

```bash
npm install
```

### 設定環境變數

複製 `.env.example` 為 `.env` 並填入實際值：

```bash
cp .env.example .env
```

### 初始化資料庫

```bash
npm run db:push
```

### 啟動開發伺服器

```bash
npm run dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

## 部署到 Zeabur

1. 連接 GitHub 儲存庫
2. 設定環境變數：
   - DATABASE_URL
   - LINE_CHANNEL_ACCESS_TOKEN
   - LINE_CHANNEL_SECRET
   - JWT_SECRET
3. 部署

## API 端點

### 認證
- POST /api/v1/auth/login - 登入
- POST /api/v1/auth/setup - 建立管理員帳號

### 預約
- GET /api/v1/appointments/today - 今日預約
- POST /api/v1/appointments - 建立預約
- PATCH /api/v1/appointments/:id/status - 更新狀態

### 病患
- GET /api/v1/patients - 病患列表
- GET /api/v1/patients/:id - 病患詳情

### 醫師
- GET /api/v1/doctors - 醫師列表
- POST /api/v1/doctors - 新增醫師

### 時段
- GET /api/v1/slots - 查詢時段
- POST /api/v1/slots - 建立時段

### 叫號
- GET /api/v1/queue/current - 目前叫號
- POST /api/v1/queue/next - 下一位

### 報表
- GET /api/v1/reports/daily - 日報表
- GET /api/v1/reports/monthly - 月報表

### LINE Bot
- POST /api/v1/line/webhook - LINE Webhook
