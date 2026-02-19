import { Router } from 'express'
import { authService } from '../services/auth.service'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body.username, req.body.password)
    res.json(result)
  } catch (error: any) {
    res.status(401).json({ error: error.message })
  }
})

router.post('/setup', async (req, res, next) => {
  try {
    const admin = await authService.createAdmin(req.body.username, req.body.password)
    res.status(201).json({ id: admin.id, username: admin.username })
  } catch (error) { next(error) }
})

export default router
