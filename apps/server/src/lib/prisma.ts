import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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

const prisma = new PrismaClient()

export default prisma
