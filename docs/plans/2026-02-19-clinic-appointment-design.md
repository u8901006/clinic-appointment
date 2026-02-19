# 診所 LINE 預約系統設計文件

## 摘要

單一診所健保門診預約系統，整合 LINE Bot 與 Web 管理後台，採 Monolith 架構部署於 Zeabur。

## 系統架構

```
┌────────────────────────────────────────────────────────────┐
│                        Zeabur Cloud                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Node.js Express App                   │  │
│  │  ┌────────────────┐  ┌────────────────┐              │  │
│  │  │   LINE Bot     │  │   Web Admin    │              │  │
│  │  │   (/webhook)   │  │   (React SPA)  │              │  │
│  │  └───────┬────────┘  └───────┬────────┘              │  │
│  │          │                   │                        │  │
│  │          └─────────┬─────────┘                        │  │
│  │                    ▼                                  │  │
│  │          ┌─────────────────┐                          │  │
│  │          │  REST API       │                          │  │
│  │          │  /api/v1/*      │                          │  │
│  │          └────────┬────────┘                          │  │
│  │                   │                                   │  │
│  │          ┌────────▼────────┐                          │  │
│  │          │  Service Layer  │                          │  │
│  │          │  - Appointment  │                          │  │
│  │          │  - Patient      │                          │  │
│  │          │  - Queue        │                          │  │
│  │          │  - Report       │                          │  │
│  │          └────────┬────────┘                          │  │
│  │                   │                                   │  │
│  │          ┌────────▼────────┐                          │  │
│  │          │   PostgreSQL    │                          │  │
│  │          │   (Prisma ORM)  │                          │  │
│  │          └─────────────────┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 技術選型

| 層級 | 技術 |
|------|------|
| Backend | Node.js 20 + Express + TypeScript |
| ORM | Prisma |
| Frontend | React 18 + Vite + TailwindCSS |
| Database | PostgreSQL 15 |
| LINE SDK | @line/bot-sdk |
| Deployment | Zeabur |

## 資料模型

### Doctor（醫師）
- id: UUID (PK)
- name: String
- specialty: String（科別）
- schedule: Json（看診時段）

### TimeSlot（看診時段）
- id: UUID (PK)
- doctorId: UUID (FK)
- date: Date
- startTime: Time
- endTime: Time
- maxPatients: Int（最大人數）
- currentCount: Int（已預約人數）

### Patient（病患）
- id: UUID (PK)
- lineUserId: String (unique)
- name: String
- phone: String
- birthDate: Date（選填）

### Appointment（預約）
- id: UUID (PK)
- patientId: UUID (FK)
- timeSlotId: UUID (FK)
- queueNumber: Int（叫號號碼）
- status: Enum (booked/checked-in/completed/cancelled)
- notes: String

### Queue（叫號佇列）
- id: UUID (PK)
- doctorId: UUID (FK)
- date: Date
- currentNumber: Int（目前叫號）

### Admin（管理員）
- id: UUID (PK)
- username: String (unique)
- passwordHash: String

## LINE Bot 互動流程

```
用戶加入好友
    │
    ▼
┌─────────────────┐
│  歡迎訊息       │
│  [開始預約]     │
│  [查詢預約]     │
│  [看診進度]     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌───────┐ ┌───────┐ ┌─────────┐
│預約流程│ │查詢預約│ │看診進度 │
└───────┘ └───────┘ └─────────┘
```

**主要功能選單（Rich Menu）：**
1. 預約看診 - 進入預約流程
2. 查詢/取消預約 - 查看現有預約
3. 看診進度 - 查看目前叫號
4. 我的資料 - 編輯個人資訊

## Web 管理後台功能

| 模組 | 功能說明 |
|------|----------|
| 儀表板 | 今日預約數、目前叫號、待診人數 |
| 預約管理 | 查看/搜尋預約、手動新增、叫號控制 |
| 病患管理 | 病患列表、搜尋、查看預約紀錄 |
| 醫師管理 | 新增/編輯醫師、設定看診時段 |
| 時段設定 | 批量產生時段、設定可預約人數 |
| 報表統計 | 預約統計、時段熱門度、醫師看診量 |
| 系統設定 | 診所資訊、LINE 設定、管理員帳號 |

## REST API Endpoints

```
/api/v1
├── /auth
│   └── POST /login
├── /appointments
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PATCH /:id/status
│   └── GET /today
├── /patients
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   └── GET /:id/appointments
├── /doctors
│   ├── GET /
│   ├── POST /
│   ├── GET /:id/slots
│   └── GET /:id/queue
├── /slots
│   ├── GET /
│   ├── POST /
│   └── POST /batch
├── /queue
│   ├── GET /current
│   ├── POST /next
│   └── POST /recall
└── /reports
    ├── GET /daily
    ├── GET /monthly
    └── GET /doctor/:id
```

## 專案目錄結構

```
clinic-appointment/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── line/
│   │   │   └── index.ts
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── main.tsx
│       └── package.json
├── packages/
│   └── shared/
├── prisma/
│   └── schema.prisma
├── package.json
├── turbo.json
└── zeabur.yaml
```

## 部署設定

- 服務 1: Node.js（Express server）
- 服務 2: PostgreSQL
- 環境變數: LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, DATABASE_URL, JWT_SECRET
