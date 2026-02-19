import prisma from '../lib/prisma'

export const reportService = {
  async getDaily(date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      include: { timeSlot: { include: { doctor: true } } }
    })

    return {
      date: startOfDay,
      total: appointments.length,
      byStatus: {
        booked: appointments.filter(a => a.status === 'BOOKED').length,
        checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length
      },
      byDoctor: this.groupByDoctor(appointments)
    }
  },

  async getMonthly(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { timeSlot: { include: { doctor: true } } }
    })

    return {
      year, month,
      total: appointments.length,
      byDoctor: this.groupByDoctor(appointments),
      dailyAverage: appointments.length / new Date(year, month, 0).getDate()
    }
  },

  groupByDoctor(appointments: any[]) {
    const grouped: Record<string, number> = {}
    for (const apt of appointments) {
      const name = apt.timeSlot?.doctor?.name || 'Unknown'
      grouped[name] = (grouped[name] || 0) + 1
    }
    return grouped
  }
}
