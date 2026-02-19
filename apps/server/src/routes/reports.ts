import { Router } from 'express'
import { reportService } from '../services/report.service'

const router = Router()

router.get('/daily', async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date()
    res.json(await reportService.getDaily(date))
  } catch (error) { next(error) }
})

router.get('/monthly', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear()
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1
    res.json(await reportService.getMonthly(year, month))
  } catch (error) { next(error) }
})

export default router
