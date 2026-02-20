const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

function runPrismaGenerateOnLinux() {
  if (process.platform === 'win32') {
    return
  }

  ensureDatabaseUrl()

  const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma')
  const result = spawnSync('npx', ['prisma', 'generate', '--schema', schemaPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_CLI_BINARY_TARGETS: 'linux-musl-openssl-3.0.x',
    },
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function configurePrismaEngineLibrary() {
  const engineFileName = 'libquery_engine-linux-musl-openssl-3.0.x.so.node'
  const candidates = [
    path.resolve(process.cwd(), `node_modules/.prisma/client/${engineFileName}`),
    path.resolve(process.cwd(), `../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(process.cwd(), `../../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(__dirname, `../../node_modules/.prisma/client/${engineFileName}`),
    path.resolve(__dirname, `../../../node_modules/.prisma/client/${engineFileName}`),
  ]

  const existing = candidates.find((candidate) => fs.existsSync(candidate))
  if (existing) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = existing
  }
}

runPrismaGenerateOnLinux()
ensureDatabaseUrl()
configurePrismaEngineLibrary()

const serverEntry = path.resolve(__dirname, '../dist/index.js')
require(serverEntry)
