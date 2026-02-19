import { messagingApi, middleware } from '@line/bot-sdk'

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
}

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
})
export const lineMiddleware = middleware(config)
