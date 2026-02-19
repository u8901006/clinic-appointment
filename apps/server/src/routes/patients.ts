import { Router } from 'express'
import { patientService } from '../services/patient.service'

const router = Router()

router.get('/', async (_req, res, next) => {
  try { res.json(await patientService.findAll()) } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try { res.status(201).json(await patientService.create(req.body)) } catch (error) { next(error) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const patient = await patientService.findById(req.params.id)
    if (!patient) return res.status(404).json({ error: 'Patient not found' })
    res.json(patient)
  } catch (error) { next(error) }
})

router.get('/:id/appointments', async (req, res, next) => {
  try { res.json(await patientService.getAppointments(req.params.id)) } catch (error) { next(error) }
})

router.put('/:id', async (req, res, next) => {
  try { res.json(await patientService.update(req.params.id, req.body)) } catch (error) { next(error) }
})

export default router
