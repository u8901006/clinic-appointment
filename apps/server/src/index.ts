import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import routes from './routes'
import { ensureBootstrapSchema } from './lib/db-bootstrap'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({
  verify: (req, _res, buf) => {
    ;(req as express.Request & { rawBody?: Buffer }).rawBody = buf
  },
}))

app.use('/api/v1', routes)

function resolveWebDistDir() {
  const candidates = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../web/dist'),
  ]

  for (const candidate of candidates) {
    const entryFile = path.join(candidate, 'index.html')
    if (fs.existsSync(entryFile)) {
      return { dir: candidate, entryFile }
    }
  }

  return null
}

const webDist = resolveWebDistDir()

if (webDist) {
  app.use(express.static(webDist.dir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }

    res.sendFile(webDist.entryFile)
  })
}

async function startServer() {
  await ensureBootstrapSchema()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to initialize server schema', error)
  process.exit(1)
})

export default app
