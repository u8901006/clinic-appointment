import prisma from '../lib/prisma'

export const queueService = {
  async getOrCreate(doctorId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    let queue = await prisma.queue.findUnique({
      where: { doctorId_date: { doctorId, date: startOfDay } }
    })

    if (!queue) {
      queue = await prisma.queue.create({
        data: { doctorId, date: startOfDay, currentNumber: 0 }
      })
    }
    return queue
  },

  async getCurrent(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)
    return { currentNumber: queue.currentNumber }
  },

  async callNext(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)

    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        timeSlot: { doctorId, date: queue.date },
        queueNumber: { gt: queue.currentNumber },
        status: 'BOOKED'
      },
      include: { patient: true },
      orderBy: { queueNumber: 'asc' }
    })

    if (!nextAppointment) {
      return { currentNumber: queue.currentNumber, nextPatient: null }
    }

    const updatedQueue = await prisma.queue.update({
      where: { id: queue.id },
      data: { currentNumber: nextAppointment.queueNumber }
    })

    return { currentNumber: updatedQueue.currentNumber, nextPatient: nextAppointment.patient }
  },

  async recall(doctorId: string, date: Date) {
    const queue = await this.getOrCreate(doctorId, date)
    const currentAppointment = await prisma.appointment.findFirst({
      where: { timeSlot: { doctorId, date: queue.date }, queueNumber: queue.currentNumber },
      include: { patient: true }
    })
    return { currentNumber: queue.currentNumber, patient: currentAppointment?.patient || null }
  }
}
