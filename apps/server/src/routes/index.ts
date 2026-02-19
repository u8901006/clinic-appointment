import { Router } from 'express'
import healthRouter from './health'
import doctorsRouter from './doctors'

const router = Router()

router.use('/health', healthRouter)
router.use('/doctors', doctorsRouter)

export default router
