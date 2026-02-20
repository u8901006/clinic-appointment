import { lineClient } from '../client'
import { WebhookEvent } from '@line/bot-sdk'
import { handleAppointmentFlow } from '../states/appointment-state'
import { stateManager } from '../states/state-manager'
import { patientService } from '../../services/patient.service'
import { queueService } from '../../services/queue.service'

const STATUS_LABEL: Record<string, string> = {
  BOOKED: '已預約',
  CHECKED_IN: '已報到',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function isSameTaipeiDate(left: Date, right: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(left) === formatter.format(right)
}

async function replyNoAppointmentRecord(replyToken: string) {
  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: 'text', text: `目前沒有您的預約紀錄。
請先輸入「預約」建立預約。` }],
  })
}

async function handleQueryAppointments(replyToken: string, lineUserId: string) {
  const patient = await patientService.findByLineUserId(lineUserId)
  if (!patient) {
    await replyNoAppointmentRecord(replyToken)
    return
  }

  const appointments = await patientService.getAppointments(patient.id)
  if (appointments.length === 0) {
    await replyNoAppointmentRecord(replyToken)
    return
  }

  const lines = appointments
    .slice(0, 5)
    .map((apt: any, index: number) => {
      const doctorName = apt.timeSlot?.doctor?.name || '未指定醫師'
      const date = formatDate(new Date(apt.timeSlot.date))
      const status = STATUS_LABEL[apt.status] || apt.status

      return `${index + 1}. ${date} ${apt.timeSlot.startTime} - ${apt.timeSlot.endTime}
醫師：${doctorName}
狀態：${status}`
    })

  await lineClient.replyMessage({
    replyToken,
    messages: [{ type: 'text', text: `您的預約紀錄：

${lines.join('\n\n')}` }],
  })
}

async function handleQueueProgress(replyToken: string, lineUserId: string) {
  const patient = await patientService.findByLineUserId(lineUserId)
  if (!patient) {
    await replyNoAppointmentRecord(replyToken)
    return
  }

  const appointments = await patientService.getAppointments(patient.id)
  const today = new Date()
  const pendingToday = appointments
    .filter((apt: any) => ['BOOKED', 'CHECKED_IN'].includes(apt.status))
    .filter((apt: any) => isSameTaipeiDate(new Date(apt.timeSlot.date), today))
    .sort((a: any, b: any) => a.queueNumber - b.queueNumber)

  if (pendingToday.length === 0) {
    await lineClient.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: '您今天沒有待看診的預約。' }],
    })
    return
  }

  const target = pendingToday[0]
  const queue = await queueService.getCurrent(target.timeSlot.doctorId, new Date(target.timeSlot.date))
  const waitingCount = Math.max(target.queueNumber - queue.currentNumber, 0)

  const progressText = waitingCount === 0
    ? '目前可能已叫號，請留意現場叫號。'
    : `預估前面還有 ${waitingCount} 位。`

  await lineClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: `看診進度：
醫師：${target.timeSlot.doctor?.name || '未指定醫師'}
您的號碼：${target.queueNumber}
目前叫號：${queue.currentNumber}
${progressText}`,
    }],
  })
}

export async function handleMessage(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') return
  if (event.source.type !== 'user') return

  const { replyToken } = event
  const text = event.message.text
  const userId = event.source.userId

  if (text === '查詢') {
    await handleQueryAppointments(replyToken, userId)
    return
  }

  if (text === '進度') {
    await handleQueueProgress(replyToken, userId)
    return
  }

  const state = stateManager.get(userId)
  if (state) {
    await handleAppointmentFlow(userId, text, userId)
    return
  }

  switch (text) {
    case '預約':
      await handleAppointmentFlow(userId, '', userId)
      break
    default:
      await lineClient.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: '您好！請選擇功能：\n\n1. 預約 - 輸入「預約」\n2. 查詢 - 輸入「查詢」\n3. 進度 - 輸入「進度」'
        }]
      })
  }
}
