import prisma from '../lib/prisma'

export const appointmentService = {
  async create(data: { patientId: string; timeSlotId: string; notes?: string }) {
    return prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({ where: { id: data.timeSlotId } })
      if (!slot) throw new Error('Time slot not found')
      if (slot.currentCount >= slot.maxPatients) throw new Error('Time slot is full')

      const existing = await tx.appointment.findFirst({
        where: { patientId: data.patientId, timeSlotId: data.timeSlotId, status: 'BOOKED' }
      })
      if (existing) throw new Error('Already booked this slot')

      const queueNumber = slot.currentCount + 1
      const appointment = await tx.appointment.create({
        data: { ...data, queueNumber, status: 'BOOKED' }
      })
      await tx.timeSlot.update({
        where: { id: data.timeSlotId },
        data: { currentCount: queueNumber }
      })
      return appointment
    })
  },

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, timeSlot: { include: { doctor: true } } }
    })
  },

  async findToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.appointment.findMany({
      where: { timeSlot: { date: { gte: today, lt: tomorrow } }, status: { not: 'CANCELLED' } },
      include: { patient: true, timeSlot: { include: { doctor: true } } },
      orderBy: [{ timeSlot: { startTime: 'asc' } }, { queueNumber: 'asc' }]
    })
  },

  async updateStatus(id: string, status: 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id } })
      if (!appointment) throw new Error('Appointment not found')

      if (status === 'CANCELLED' && appointment.status !== 'CANCELLED') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { currentCount: { decrement: 1 } }
        })
      }
      return tx.appointment.update({ where: { id }, data: { status } })
    })
  }
}
