import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const decoded = authService.verifyToken(authHeader.slice(7))
    ;(req as any).user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
