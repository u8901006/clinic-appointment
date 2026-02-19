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
