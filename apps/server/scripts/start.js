const { spawnSync } = require('child_process')
const path = require('path')

function runPrismaGenerateOnLinux() {
  if (process.platform === 'win32') {
    return
  }

  const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma')
  const result = spawnSync('npx', ['prisma', 'generate', '--schema', schemaPath], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

runPrismaGenerateOnLinux()

const serverEntry = path.resolve(__dirname, '../dist/index.js')
require(serverEntry)
