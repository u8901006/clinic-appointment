import line from '@line/bot-sdk'

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
}

export const lineClient = new line.messagingApi.MessagingApiClient(config.channelAccessToken)
export const lineMiddleware = line.middleware(config)
