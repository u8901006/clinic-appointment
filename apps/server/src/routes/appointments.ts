import { Router } from 'express'
import { appointmentService } from '../services/appointment.service'

const router = Router()

router.get('/today', async (_req, res, next) => {
  try { res.json(await appointmentService.findToday()) } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await appointmentService.create(req.body)) } catch (error: any) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.findById(req.params.id)
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' })
    res.json(appointment)
  } catch (error) { next(error) }
})

router.patch('/:id/status', async (req, res, next) => {
  try { res.json(await appointmentService.updateStatus(req.params.id, req.body.status)) } catch (error) { next(error) }
})

export default router
