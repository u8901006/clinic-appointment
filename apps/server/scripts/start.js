const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runPrismaGenerateOnLinux() {
  if (process.platform === 'win32') {
    return
  }

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
configurePrismaEngineLibrary()

const serverEntry = path.resolve(__dirname, '../dist/index.js')
require(serverEntry)
