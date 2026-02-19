import { messagingApi, middleware, MiddlewareConfig } from '@line/bot-sdk'

let _lineClient: messagingApi.MessagingApiClient | null = null
let _lineMiddleware: ReturnType<typeof middleware> | null = null

function getConfig(): { channelAccessToken: string; channelSecret: string } {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const channelSecret = process.env.LINE_CHANNEL_SECRET
  
  if (!channelAccessToken || !channelSecret) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET not set. LINE Bot features will be disabled.')
  }
  
  return { channelAccessToken: channelAccessToken || '', channelSecret: channelSecret || '' }
}

export function getLineClient(): messagingApi.MessagingApiClient {
  if (!_lineClient) {
    const config = getConfig()
    if (!config.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    }
    _lineClient = new messagingApi.MessagingApiClient({
      channelAccessToken: config.channelAccessToken
    })
  }
  return _lineClient
}

export function getLineMiddleware() {
  if (!_lineMiddleware) {
    const config = getConfig()
    if (!config.channelSecret) {
      throw new Error('LINE_CHANNEL_SECRET is not configured')
    }
    _lineMiddleware = middleware(config as MiddlewareConfig)
  }
  return _lineMiddleware
}

// For backward compatibility - these will be null if env vars not set
export const lineClient = {
  pushMessage: async (params: any) => getLineClient().pushMessage(params),
  replyMessage: async (params: any) => getLineClient().replyMessage(params),
}
export const lineMiddleware = (req: any, res: any, next: any) => getLineMiddleware()(req, res, next)
