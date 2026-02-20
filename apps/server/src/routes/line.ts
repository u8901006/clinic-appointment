import { Router, type ErrorRequestHandler } from 'express'
import { lineMiddleware } from '../line/client'
import { handleEvent } from '../line/handlers'

const router = Router()

router.post('/webhook', lineMiddleware, (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events : []

  Promise.all(events.map(handleEvent))
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err)
      res.status(500).end()
    })
})

const lineWebhookErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err?.name === 'SignatureValidationFailed') {
    res.status(401).end()
    return
  }

  next(err)
}

router.use(lineWebhookErrorHandler)

export default router
