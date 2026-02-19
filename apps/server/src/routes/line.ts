import { Router } from 'express'
import { lineMiddleware } from '../line/client'
import { handleEvent } from '../line/handlers'

const router = Router()

router.post('/webhook', lineMiddleware, (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err)
      res.status(500).end()
    })
})

export default router
