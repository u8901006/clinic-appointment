import { lineClient } from '../client'
import { WebhookEvent } from '@line/bot-sdk'
import { handleAppointmentFlow } from '../states/appointment-state'
import { stateManager } from '../states/state-manager'

export async function handleMessage(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') return
  if (event.source.type !== 'user') return

  const { replyToken } = event
  const text = event.message.text
  const userId = event.source.userId

  const state = stateManager.get(userId)
  if (state) {
    await handleAppointmentFlow(userId, text, userId)
    return
  }

  switch (text) {
    case '預約':
      await handleAppointmentFlow(userId, '', userId)
      break
    case '查詢':
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '正在查詢您的預約紀錄...' }]
      })
      break
    case '進度':
      await lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: '正在查詢看診進度...' }]
      })
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
