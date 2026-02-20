import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/line/client', () => ({
  lineClient: {
    pushMessage: vi.fn(),
    replyMessage: vi.fn(),
  },
}))

vi.mock('../../../src/line/states/appointment-state', () => ({
  handleAppointmentFlow: vi.fn(),
}))

vi.mock('../../../src/line/states/state-manager', () => ({
  stateManager: {
    get: vi.fn(() => undefined),
  },
}))

vi.mock('../../../src/services/patient.service', () => ({
  patientService: {
    findByLineUserId: vi.fn(),
    getAppointments: vi.fn(),
  },
}))

vi.mock('../../../src/services/queue.service', () => ({
  queueService: {
    getCurrent: vi.fn(),
  },
}))

import { handleMessage } from '../../../src/line/handlers/message'
import { lineClient } from '../../../src/line/client'
import { patientService } from '../../../src/services/patient.service'
import { queueService } from '../../../src/services/queue.service'

function createTextEvent(text: string) {
  return {
    type: 'message',
    replyToken: 'reply-token',
    message: { type: 'text', text },
    source: { type: 'user', userId: 'line-user-1' },
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('LINE message command handlers', () => {
  it('returns appointment summary for 查詢 command', async () => {
    ;(patientService.findByLineUserId as any).mockResolvedValue({ id: 'patient-1', name: '王小明' })
    ;(patientService.getAppointments as any).mockResolvedValue([
      {
        id: 'apt-1',
        queueNumber: 5,
        status: 'BOOKED',
        timeSlot: {
          date: new Date('2026-02-20T09:00:00+08:00'),
          startTime: '09:00',
          endTime: '09:30',
          doctorId: 'doctor-1',
          doctor: { name: '王醫師' },
        },
      },
    ])
    ;(lineClient.replyMessage as any).mockResolvedValue(undefined)

    await handleMessage(createTextEvent('查詢') as any)

    expect(lineClient.replyMessage).toHaveBeenCalledTimes(1)
    const payload = (lineClient.replyMessage as any).mock.calls[0][0]
    expect(payload.replyToken).toBe('reply-token')
    expect(payload.messages[0].text).toContain('您的預約')
    expect(payload.messages[0].text).toContain('王醫師')
    expect(payload.messages[0].text).toContain('09:00 - 09:30')
  })

  it('returns queue progress for 進度 command', async () => {
    ;(patientService.findByLineUserId as any).mockResolvedValue({ id: 'patient-1', name: '王小明' })
    ;(patientService.getAppointments as any).mockResolvedValue([
      {
        id: 'apt-1',
        queueNumber: 12,
        status: 'BOOKED',
        timeSlot: {
          date: new Date(),
          startTime: '09:00',
          endTime: '09:30',
          doctorId: 'doctor-1',
          doctor: { name: '王醫師' },
        },
      },
    ])
    ;(queueService.getCurrent as any).mockResolvedValue({ currentNumber: 9 })
    ;(lineClient.replyMessage as any).mockResolvedValue(undefined)

    await handleMessage(createTextEvent('進度') as any)

    expect(lineClient.replyMessage).toHaveBeenCalledTimes(1)
    const payload = (lineClient.replyMessage as any).mock.calls[0][0]
    expect(payload.replyToken).toBe('reply-token')
    expect(payload.messages[0].text).toContain('看診進度')
    expect(payload.messages[0].text).toContain('目前叫號')
    expect(payload.messages[0].text).toContain('還有 3 位')
  })
})
