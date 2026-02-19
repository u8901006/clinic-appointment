import { lineClient } from '../client'
import { WebhookEvent } from '@line/bot-sdk'

export async function handleFollow(event: WebhookEvent) {
  if (event.type !== 'follow') return

  const { replyToken } = event

  await lineClient.replyMessage({
    replyToken,
    messages: [{
      type: 'text',
      text: '歡迎加入診所預約系統！\n\n請選擇功能：\n1. 預約看診\n2. 查詢預約\n3. 看診進度'
    }]
  })
}
