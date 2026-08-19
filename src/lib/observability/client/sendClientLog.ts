import type { LogPayload } from 'types/observability/log/LogPayload'

export const CLIENT_LOG_PATH = '/api/log'

export type SendClientLogTransport = {
  fetch: typeof fetch
  sendBeacon?: (url: string, data: Blob) => boolean
}

export async function sendClientLog(
  payload: LogPayload,
  transport: SendClientLogTransport
): Promise<void> {
  const body = JSON.stringify(payload)

  try {
    await transport.fetch(CLIENT_LOG_PATH, {
      body,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      method: 'POST'
    })
  } catch {
    transport.sendBeacon?.(
      CLIENT_LOG_PATH,
      new Blob([body], { type: 'text/plain;charset=UTF-8' })
    )
  }
}
