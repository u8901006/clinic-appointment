import prisma from '../lib/prisma'

export const patientService = {
  async create(data: { lineUserId: string; name: string; phone: string; birthDate?: Date }) {
    return prisma.patient.create({ data })
  },

  async findByLineUserId(lineUserId: string) {
    return prisma.patient.findUnique({ where: { lineUserId } })
  },

  async findById(id: string) {
    return prisma.patient.findUnique({ where: { id } })
  },

  async findAll() {
    return prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { appointments: true } } }
    })
  },

  async update(id: string, data: Partial<{ name: string; phone: string; birthDate: Date }>) {
    return prisma.patient.update({ where: { id }, data })
  },

  async getAppointments(id: string) {
    return prisma.appointment.findMany({
      where: { patientId: id },
      include: { timeSlot: { include: { doctor: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }
}
