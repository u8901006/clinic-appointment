import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export const authService = {
  async login(username: string, password: string) {
    const admin = await prisma.admin.findUnique({ where: { username } })
    if (!admin) throw new Error('Invalid credentials')
    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) throw new Error('Invalid credentials')
    return { token: jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' }) }
  },

  async createAdmin(username: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10)
    return prisma.admin.create({ data: { username, passwordHash } })
  },

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string }
  }
}
