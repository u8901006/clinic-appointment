import prisma from '../lib/prisma'

export const doctorService = {
  async create(data: { name: string; specialty: string; schedule?: object }) {
    return prisma.doctor.create({ data })
  },

  async findAll() {
    return prisma.doctor.findMany({ orderBy: { createdAt: 'desc' } })
  },

  async findById(id: string) {
    return prisma.doctor.findUnique({ where: { id } })
  },

  async update(id: string, data: Partial<{ name: string; specialty: string; schedule: object }>) {
    return prisma.doctor.update({ where: { id }, data })
  },

  async delete(id: string) {
    return prisma.doctor.delete({ where: { id } })
  }
}
