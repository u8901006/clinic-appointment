import { WebhookEvent } from '@line/bot-sdk'
import { handleMessage } from './message'
import { handleFollow } from './follow'

export async function handleEvent(event: WebhookEvent) {
  switch (event.type) {
    case 'message':
      return handleMessage(event)
    case 'follow':
      return handleFollow(event)
    default:
      return Promise.resolve()
  }
}
