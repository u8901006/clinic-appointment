import { Router } from 'express'
import { slotService } from '../services/slot.service'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const { doctorId, date, startDate, endDate } = req.query
    if (doctorId && date) {
      const slots = await slotService.findByDoctorAndDate(doctorId as string, new Date(date as string))
      return res.json(slots)
    }

    if (doctorId && startDate && endDate) {
      const slots = await slotService.findByDoctorAndRange(
        doctorId as string,
        new Date(startDate as string),
        new Date(endDate as string)
      )
      return res.json(slots)
    }

    res.status(400).json({ error: 'doctorId with date, or doctorId with startDate and endDate are required' })
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const slot = await slotService.create(req.body)
    res.status(201).json(slot)
  } catch (error) { next(error) }
})

router.post('/batch', async (req, res, next) => {
  try {
    const result = await slotService.createBatch(req.body.slots)
    res.status(201).json({ created: result.count })
  } catch (error) { next(error) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const slot = await slotService.findById(req.params.id)
    if (!slot) return res.status(404).json({ error: 'Slot not found' })
    res.json(slot)
  } catch (error) { next(error) }
})

export default router
