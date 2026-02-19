import prisma from '../lib/prisma'

export const slotService = {
  async create(data: { doctorId: string; date: Date; startTime: string; endTime: string; maxPatients?: number }) {
    return prisma.timeSlot.create({ data })
  },

  async createBatch(slots: Array<{ doctorId: string; date: Date; startTime: string; endTime: string; maxPatients?: number }>) {
    return prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })
  },

  async findByDoctorAndDate(doctorId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return prisma.timeSlot.findMany({
      where: { doctorId, date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { startTime: 'asc' }
    })
  },

  async findById(id: string) {
    return prisma.timeSlot.findUnique({ where: { id }, include: { doctor: true } })
  },

  async incrementCount(id: string) {
    return prisma.timeSlot.update({ where: { id }, data: { currentCount: { increment: 1 } } })
  },

  async decrementCount(id: string) {
    return prisma.timeSlot.update({ where: { id }, data: { currentCount: { decrement: 1 } } })
  }
}
