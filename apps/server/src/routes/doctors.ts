import { Router } from 'express'
import { doctorService } from '../services/doctor.service'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const doctors = await doctorService.findAll()
    res.json(doctors)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const doctor = await doctorService.create(req.body)
    res.status(201).json(doctor)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await doctorService.findById(req.params.id)
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
    res.json(doctor)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const doctor = await doctorService.update(req.params.id, req.body)
    res.json(doctor)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await doctorService.delete(req.params.id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
