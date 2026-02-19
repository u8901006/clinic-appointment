import { Router } from 'express'
import healthRouter from './health'
import doctorsRouter from './doctors'
import slotsRouter from './slots'
import patientsRouter from './patients'
import appointmentsRouter from './appointments'
import queueRouter from './queue'
import reportsRouter from './reports'
import authRouter from './auth'

const router = Router()

router.use('/health', healthRouter)
router.use('/doctors', doctorsRouter)
router.use('/slots', slotsRouter)
router.use('/patients', patientsRouter)
router.use('/appointments', appointmentsRouter)
router.use('/queue', queueRouter)
router.use('/reports', reportsRouter)
router.use('/auth', authRouter)

export default router
