import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

function resolveDatabaseUrl() {
  const keys = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRESQL_URL',
    'DB_URL',
    'ZEABUR_DATABASE_URL',
    'ZEABUR_POSTGRESQL_URL',
  ]

  for (const key of keys) {
    const value = process.env[key]
    if (value && value.trim()) {
      return value.trim()
    }
  }

  const host = process.env.PGHOST
  const port = process.env.PGPORT || '5432'
  const user = process.env.PGUSER
  const password = process.env.PGPASSWORD
  const database = process.env.PGDATABASE

  if (host && user && password && database) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=public`
  }

  return ''
}

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return
  }

  const resolved = resolveDatabaseUrl()
  if (resolved) {
    process.env.DATABASE_URL = resolved
  }
}

function configurePrismaEngineLibrary() {
  if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    return
  }

  const engineFileName = 'libquery_engine-linux-musl-openssl-3.0.x.so.node'
  const candidates = [
    path.resolve(process.cwd(), `node_modules/.prisma/client/${engineFileName}`),
    path.resolve(process.cwd(), `../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(process.cwd(), `../../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(__dirname, `../../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(__dirname, `../../../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(__dirname, `../../../../node_modules/.prisma/client/${engineFileName}`),
  ]

  const existingEnginePath = candidates.find((candidate) => fs.existsSync(candidate))
  if (existingEnginePath) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = existingEnginePath
  }
}

configurePrismaEngineLibrary()
ensureDatabaseUrl()

const prisma = new PrismaClient(
  process.env.DATABASE_URL
    ? {
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      }
    : undefined
)

export default prisma
