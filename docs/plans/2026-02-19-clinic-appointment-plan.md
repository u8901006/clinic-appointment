# 診所 LINE 預約系統實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立診所健保門診 LINE 預約系統，含 LINE Bot 與 Web 管理後台

**Architecture:** Monolith 架構，Express 後端同時服務 LINE Webhook 與 REST API，React SPA 作為管理後台，PostgreSQL 作為資料庫。

**Tech Stack:** Node.js 20, Express, TypeScript, Prisma, React 18, Vite, TailwindCSS, PostgreSQL, LINE Bot SDK

---

## Task 1: 專案初始化與 Monorepo 設定

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: 建立根目錄 package.json**

```json
{
  "name": "clinic-appointment",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: 建立 turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "test": { "dependsOn": ["build"] }
  }
}
```

**Step 3: 建立 .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.turbo/
```

**Step 4: 建立 .nvmrc**

```
20
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with turborepo"
```

---

## Task 2: 後端專案結構設定

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts`

**Step 1: 建立 apps/server/package.json**

```json
{
  "name": "@clinic/server",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@line/bot-sdk": "^9.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**Step 2: 建立 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 建立基礎 Express 伺服器 src/index.ts**

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
```

**Step 4: Commit**

```bash
git add apps/server
git commit -m "chore(server): setup express project structure"
```

---

## Task 3: Prisma 資料庫 Schema

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: 建立 Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Doctor {
  id        String     @id @default(uuid())
  name      String
  specialty String
  schedule  Json?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  slots     TimeSlot[]
  queues    Queue[]
}

model TimeSlot {
  id           String       @id @default(uuid())
  doctorId     String
  doctor       Doctor       @relation(fields: [doctorId], references: [id])
  date         DateTime
  startTime    String
  endTime      String
  maxPatients  Int          @default(20)
  currentCount Int          @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  appointments Appointment[]

  @@index([doctorId, date])
}

model Patient {
  id           String       @id @default(uuid())
  lineUserId   String       @unique
  name         String
  phone        String
  birthDate    DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  appointments Appointment[]
}

model Appointment {
  id          String            @id @default(uuid())
  patientId   String
  patient     Patient           @relation(fields: [patientId], references: [id])
  timeSlotId  String
  timeSlot    TimeSlot          @relation(fields: [timeSlotId], references: [id])
  queueNumber Int
  status      AppointmentStatus @default(BOOKED)
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([timeSlotId])
  @@index([patientId])
}

enum AppointmentStatus {
  BOOKED
  CHECKED_IN
  COMPLETED
  CANCELLED
}

model Queue {
  id            String   @id @default(uuid())
  doctorId      String
  doctor        Doctor   @relation(fields: [doctorId], references: [id])
  date          DateTime
  currentNumber Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([doctorId, date])
}

model Admin {
  id           String   @id @default(uuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Step 2: Commit**

```bash
git add prisma
git commit -m "feat(db): add prisma schema for clinic appointment"
```

---

## Task 4: Prisma Client 與資料庫連線

**Files:**
- Create: `apps/server/src/lib/prisma.ts`

**Step 1: 建立 Prisma client wrapper**

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
```

**Step 2: Commit**

```bash
git add apps/server/src/lib
git commit -m "feat(db): add prisma client wrapper"
```

---

## Task 5: Express 路由結構

**Files:**
- Create: `apps/server/src/routes/index.ts`
- Create: `apps/server/src/routes/health.ts`

**Step 1: 建立健康檢查路由 health.ts**

```typescript
import { Router } from 'express'

const router = Router()

router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
```

**Step 2: 建立路由匯總 index.ts**

```typescript
import { Router } from 'express'
import healthRouter from './health'

const router = Router()

router.use('/health', healthRouter)

export default router
```

**Step 3: 更新 src/index.ts 使用路由**

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/v1', routes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
```

**Step 4: Commit**

```bash
git add apps/server/src/routes apps/server/src/index.ts
git commit -m "feat(server): add express router structure"
```

---

## Task 6: 醫師 API（CRUD）

**Files:**
- Create: `apps/server/src/routes/doctors.ts`
- Create: `apps/server/src/services/doctor.service.ts`
- Create: `apps/server/src/routes/doctors.test.ts`

**Step 1: 建立醫師服務層**

```typescript
import prisma from '../lib/prisma'

export const doctorService = {
  async create(data: { name: string; specialty: string; schedule?: object }) {
    return prisma.doctor.create({ data })
  },

  async findAll() {
    return prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } })
  },

  async findById(id: string) {
    return prisma.doctor.findUnique({ where: { id } })
  },

  async update(id: string, data: Partial<{ name: string; specialty: string; schedule: object }>) {
    return prisma.doctor.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.doctor.delete({ where: { id } })
  }
}
```

**Step 2: 建立醫師路由**

```typescript
import { Router } from 'express'
import { doctorService } from '../services/doctor.service'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const doctors = await doctorService.findAll()
    res.json(doctors)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const doctor = await doctorService.create(req.body)
    res.status(201).json(doctor)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await doctorService.findById(req.params.id)
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    res.json(doctor)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const doctor = await doctorService.update(req.params.id, req.body)
    res.json(doctor)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await doctorService.delete(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
```

**Step 3: 註冊路由至 routes/index.ts**

Add: `import doctorsRouter from './doctors'` and `router.use('/doctors', doctorsRouter)`

**Step 4: Commit**

```bash
git add apps/server/src/routes/doctors.ts apps/server/src/services apps/server/src/routes/index.ts
git commit -m "feat(api): add doctors CRUD endpoints"
```

---

## Task 7: 時段 API（TimeSlot）

**Files:**
- Create: `apps/server/src/services/slot.service.ts`
- Create: `apps/server/src/routes/slots.ts`

**Step 1: 建立時段服務層**

```typescript
import prisma from '../lib/prisma'

export const slotService = {
  async create(data: { doctorId: string; date: Date; startTime: string; endTime: string; maxPatients?: number }) {
    return prisma.timeSlot.create({ data })
  },

  async createBatch(slots: Array<{ doctorId: string; date: Date; startTime: string; endTime: string; maxPatients?: number }>) {
    return prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })
  },

  async findByDoctorAndDate(doctorId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.timeSlot.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { startTime: 'asc' }
    })
  },

  async findAvailable(doctorId: string, date: Date) {
    const slots = await this.findByDoctorAndDate(doctorId, date)
    return slots.filter(slot => slot.currentCount < slot.maxPatients)
  },

  async findById(id: string) {
    return prisma.timeSlot.findUnique({
      where: { id },
      include: { doctor: true }
    })
  },

  async incrementCount(id: string) {
    return prisma.timeSlot.update({
      where: { id },
      data: { currentCount: { increment: 1 } }
    })
  },

  async decrementCount(id: string) {
    return prisma.timeSlot.update({
      where: { id },
      data: { currentCount: { decrement: 1 } }
    })
  }
}
```

**Step 2: 建立時段路由**

```typescript
import { Router } from 'express'
import { slotService } from '../services/slot.service'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query
    if (doctorId && date) {
      const slots = await slotService.findByDoctorAndDate(doctorId as string, new Date(date as string))
      return res.json(slots)
    }
    res.status(400).json({ error: 'doctorId and date are required' })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const slot = await slotService.create(req.body)
    res.status(201).json(slot)
  } catch (error) {
    next(error)
  }
})

router.post('/batch', async (req, res, next) => {
  try {
    const result = await slotService.createBatch(req.body.slots)
    res.status(201).json({ created: result.count })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const slot = await slotService.findById(req.params.id)
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    res.json(slot)
  } catch (error) {
    next(error)
  }
})

export default router
```

**Step 3: 註冊路由至 routes/index.ts**

**Step 4: Commit**

```bash
git add apps/server/src/services/slot.service.ts apps/server/src/routes/slots.ts
git commit -m "feat(api): add time slots CRUD endpoints"
```

---

## Task 8: 病患 API（Patient）

**Files:**
- Create: `apps/server/src/services/patient.service.ts`
- Create: `apps/server/src/routes/patients.ts`

**Step 1: 建立病患服務層**

```typescript
import prisma from '../lib/prisma'

export const patientService = {
  async create(data: { lineUserId: string; name: string; phone: string; birthDate?: Date }) {
    return prisma.patient.create({ data })
  },

  async findByLineUserId(lineUserId: string) {
    return prisma.patient.findUnique({ where: { lineUserId } })
  },

  async findById(id: string) {
    return prisma.patient.findUnique({ where: { id } })
  },

  async findAll() {
    return prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { appointments: true } } }
    })
  },

  async update(id: string, data: Partial<{ name: string; phone: string; birthDate: Date }>) {
    return prisma.patient.update({ where: { id }, data })
  },

  async getAppointments(id: string) {
    return prisma.appointment.findMany({
      where: { patientId: id },
      include: { timeSlot: { include: { doctor: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
}
```

**Step 2: 建立病患路由並註冊**

**Step 3: Commit**

---

## Task 9: 預約 API（Appointment）

**Files:**
- Create: `apps/server/src/services/appointment.service.ts`
- Create: `apps/server/src/routes/appointments.ts`

**Step 1: 建立預約服務層（含叫號號碼產生）**

```typescript
import prisma from '../lib/prisma'

export const appointmentService = {
  async create(data: { patientId: string; timeSlotId: string; notes?: string }) {
    return prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({ where: { id: data.timeSlotId } })
      if (!slot) throw new Error('Time slot not found')
      if (slot.currentCount >= slot.maxPatients) throw new Error('Time slot is full')

      const existingAppointment = await tx.appointment.findFirst({
        where: { patientId: data.patientId, timeSlotId: data.timeSlotId, status: 'BOOKED' }
      })
      if (existingAppointment) throw new Error('Already booked this slot')

      const queueNumber = slot.currentCount + 1

      const appointment = await tx.appointment.create({
        data: { ...data, queueNumber, status: 'BOOKED' }
      })

      await tx.timeSlot.update({
        where: { id: data.timeSlotId },
        data: { currentCount: queueNumber }
      })

      return appointment
    })
  },

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, timeSlot: { include: { doctor: true } } }
    })
  },

  async findByPatient(patientId: string) {
    return prisma.appointment.findMany({
      where: { patientId },
      include: { timeSlot: { include: { doctor: true } } },
      orderBy: { createdAt: 'desc' }
    })
  },

  async findToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.appointment.findMany({
      where: {
        timeSlot: { date: { gte: today, lt: tomorrow } },
        status: { not: 'CANCELLED' }
      },
      include: { patient: true, timeSlot: { include: { doctor: true } } },
      orderBy: [{ timeSlot: { startTime: 'asc' } }, { queueNumber: 'asc' }]
    })
  },

  async updateStatus(id: string, status: 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } })
      if (!appointment) throw new Error('Appointment not found')

      if (status === 'CANCELLED' && appointment.status !== 'CANCELLED') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { currentCount: { decrement: 1 } }
        })
      }

      return tx.appointment.update({ where: { id }, data: { status } })
    })
  },

  async cancel(id: string) {
    return this.updateStatus(id, 'CANCELLED')
  }
}
```

**Step 2: 建立預約路由並註冊**

**Step 3: Commit**

---

## Task 10: 叫號 API（Queue）

**Files:**
- Create: `apps/server/src/services/queue.service.ts`
- Create: `apps/server/src/routes/queue.ts`

**Step 1: 建立叫號服務層**

```typescript
import prisma from '../lib/prisma'

export const queueService = {
  async getOrCreate(doctorId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    let queue = await prisma.queue.findUnique({
      where: { doctorId_date: { doctorId, date: startOfDay } }
    })

    if (!queue) {
      queue = await prisma.queue.create({
        data: { doctorId, date: startOfDay, currentNumber: 0 }
      })
    }

    return queue
  },

  async getCurrent(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)
    return { currentNumber: queue.currentNumber }
  },

  async callNext(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)

    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        timeSlot: { doctorId, date: queue.date },
        queueNumber: { gt: queue.currentNumber },
        status: 'BOOKED'
      },
      include: { patient: true },
      orderBy: { queueNumber: 'asc' }
    })

    if (!nextAppointment) {
      return { currentNumber: queue.currentNumber, nextPatient: null }
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queue.id },
      data: { currentNumber: nextAppointment.queueNumber }
    })

    return {
      currentNumber: updatedQueue.currentNumber,
      nextPatient: nextAppointment.patient
    }
  },

  async recall(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)
    const currentAppointment = await prisma.appointment.findFirst({
      where: {
        timeSlot: { doctorId, date: queue.date },
        queueNumber: queue.currentNumber
      },
      include: { patient: true }
    })

    return {
      currentNumber: queue.currentNumber,
      patient: currentAppointment?.patient || null
    }
  }
}
```

**Step 2: 建立叫號路由並註冊**

**Step 3: Commit**

---

## Task 11: 報表 API（Reports）

**Files:**
- Create: `apps/server/src/services/report.service.ts`
- Create: `apps/server/src/routes/reports.ts`

**Step 1: 建立報表服務層**

```typescript
import prisma from '../lib/prisma'

export const reportService = {
  async getDaily(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { timeSlot: { include: { doctor: true } } }
    })

    return {
      date: startOfDay,
      total: appointments.length,
      byStatus: {
        booked: appointments.filter(a => a.status === 'BOOKED').length,
        checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length
      },
      byDoctor: this.groupByDoctor(appointments)
    }
  },

  async getMonthly(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { timeSlot: { include: { doctor: true } } }
    })

    return {
      year,
      month,
      total: appointments.length,
      byDoctor: this.groupByDoctor(appointments),
      dailyAverage: appointments.length / new Date(year, month, 0).getDate()
    }
  },

  async getByDoctor(doctorId: string, startDate: Date, endDate: Date) {
    const appointments = await prisma.appointment.findMany({
      where: {
        timeSlot: { doctorId },
        createdAt: { gte: startDate, lte: endDate }
      }
    })

    return {
      doctorId,
      total: appointments.length,
      byStatus: {
        booked: appointments.filter(a => a.status === 'BOOKED').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length
      }
    }
  },

  groupByDoctor(appointments: any[]) {
    const grouped: Record<string, number> = {}
    for (const apt of appointments) {
      const doctorName = apt.timeSlot?.doctor?.name || 'Unknown'
      grouped[doctorName] = (grouped[doctorName] || 0) + 1
    }
    return grouped
  }
}
```

**Step 2: 建立報表路由並註冊**

**Step 3: Commit**

---

## Task 12: 認證中間件（Auth）

**Files:**
- Create: `apps/server/src/middleware/auth.ts`
- Create: `apps/server/src/routes/auth.ts`
- Create: `apps/server/src/services/auth.service.ts`

**Step 1: 建立認證服務**

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export const authService = {
  async login(username: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) throw new Error('Invalid credentials')

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' })
    return { token }
  },

  async createAdmin(username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10)
    return prisma.admin.create({ data: { username, passwordHash } })
  },

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string }
  }
}
```

**Step 2: 建立認證中間件**

```typescript
import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = authService.verifyToken(token)
    ;(req as any).user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

**Step 3: 建立認證路由**

**Step 4: Commit**

---

## Task 13: LINE Bot 設定

**Files:**
- Create: `apps/server/src/line/client.ts`
- Create: `apps/server/src/line/handlers/index.ts`
- Create: `apps/server/src/line/handlers/message.ts`
- Create: `apps/server/src/line/handlers/follow.ts`
- Create: `apps/server/src/routes/line.ts`

**Step 1: 建立 LINE Bot 客戶端**

```typescript
import line from '@line/bot-sdk'

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
}

export const lineClient = new line.messagingApi.MessagingApiClient(config.channelAccessToken)
export const lineMiddleware = line.middleware(config)
```

**Step 2: 建立訊息處理器**

```typescript
import { lineClient } from '../client'
import { WebhookEvent } from '@line/bot-sdk'

export async function handleMessage(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') return

  const { replyToken } = event
  const text = event.message.text

  const responses: Record<string, string> = {
    '預約': '請選擇要預約的醫師',
    '查詢': '正在查詢您的預約紀錄...',
    '進度': '正在查詢看診進度...'
  }

  await lineClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: responses[text] || '您好！請選擇功能：\n1. 預約\n2. 查詢\n3. 進度'
    }]
  })
}
```

**Step 3: 建立 Follow 處理器**

```typescript
import { lineClient } from '../client'
import { WebhookEvent } from '@line/bot-sdk'

export async function handleFollow(event: WebhookEvent) {
  if (event.type !== 'follow') return

  const { replyToken } = event

  await lineClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: '歡迎加入診所預約系統！\n\n請選擇功能：\n1. 預約看診\n2. 查詢預約\n3. 看診進度'
    }]
  })
}
```

**Step 4: 建立 Webhook 路由並註冊**

**Step 5: Commit**

---

## Task 14: LINE Bot 預約流程

**Files:**
- Create: `apps/server/src/line/states/appointment-state.ts`
- Create: `apps/server/src/line/states/state-manager.ts`

**Step 1: 建立狀態管理器（處理多步驟對話）**

```typescript
const states = new Map<string, { step: string; data: Record<string, any> }>()

export const stateManager = {
  set(userId: string, step: string, data: Record<string, any> = {}) {
    states.set(userId, { step, data })
  },

  get(userId: string) {
    return states.get(userId)
  },

  clear(userId: string) {
    states.delete(userId)
  }
}
```

**Step 2: 建立預約狀態處理邏輯**

**Step 3: Commit**

---

## Task 15: Web 前端專案設定

**Files:**
- Create: `apps/web/` (Vite React TypeScript 專案)

**Step 1: 建立 Vite 專案**

```bash
cd apps && npm create vite@latest web -- --template react-ts
```

**Step 2: 安裝 TailwindCSS**

```bash
cd web && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

**Step 3: 安裝其他依賴**

```bash
npm install react-router-dom @tanstack/react-query axios
```

**Step 4: Commit**

---

## Task 16-20: Web 管理後台頁面

- **Task 16**: 登入頁面
- **Task 17**: 儀表板頁面
- **Task 18**: 預約管理頁面
- **Task 19**: 叫號控制頁面
- **Task 20**: 報表統計頁面

---

## Task 21: 部署設定

**Files:**
- Create: `Dockerfile`
- Create: `zeabur.yaml`

**Step 1: 建立 Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

**Step 2: Commit**

---

## Summary

Total: 21 tasks covering full implementation from monorepo setup to deployment.
