import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

function configurePrismaEngineLibrary() {
  if (process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
    return
  }

  const candidates = [
    path.resolve(process.cwd(), 'node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node'),
    path.resolve(process.cwd(), 'apps/server/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node'),
    path.resolve(__dirname, '../../node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node'),
  ]

  const existingEnginePath = candidates.find((candidate) => fs.existsSync(candidate))
  if (existingEnginePath) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = existingEnginePath
  }
}

configurePrismaEngineLibrary()

const prisma = new PrismaClient()

export default prisma
