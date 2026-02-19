import { Router } from 'express'
import { queueService } from '../services/queue.service'

const router = Router()

router.get('/current', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date) return res.status(400).json({ error: 'doctorId and date required' })
    res.json(await queueService.getCurrent(doctorId as string, new Date(date as string)))
  } catch (error) { next(error) }
})

router.post('/next', async (req, res, next) => {
  try {
    const { doctorId, date } = req.body
    res.json(await queueService.callNext(doctorId, new Date(date)))
  } catch (error) { next(error) }
})

router.post('/recall', async (req, res, next) => {
  try {
    const { doctorId, date } = req.body
    res.json(await queueService.recall(doctorId, new Date(date)))
  } catch (error) { next(error) }
})

export default router
