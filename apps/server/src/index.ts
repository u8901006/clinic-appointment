import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import routes from './routes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({
  verify: (req, _res, buf) => {
    ;(req as express.Request & { rawBody?: Buffer }).rawBody = buf
  },
}))

app.use('/api/v1', routes)

const webDistDir = path.resolve(process.cwd(), 'public')
const webEntryFile = path.join(webDistDir, 'index.html')

if (fs.existsSync(webEntryFile)) {
  app.use(express.static(webDistDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }

    res.sendFile(webEntryFile)
  })
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
