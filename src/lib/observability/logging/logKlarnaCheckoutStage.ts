import { logToAppLogs } from '@/lib/utils/logToAppLogs'

type KlarnaCheckoutStage =
  | 'order_request_received'
  | 'order_created'
  | 'order_creation_failed'

type LogKlarnaCheckoutStageInput = {
  durationMs: number
  request: Request
  stage: KlarnaCheckoutStage
}

export async function logKlarnaCheckoutStage(
  input: LogKlarnaCheckoutStageInput
): Promise<void> {
  const vercelId = input.request.headers.get('x-vercel-id')

  try {
    await logToAppLogs({
      event: 'commerce.klarna_checkout',
      level: 'INFO',
      data: {
        durationMs: input.durationMs,
        stage: input.stage
      },
      context: {
        requestPath: '/api/klarna/orders',
        ...(vercelId ? { vercelId } : {})
      }
    })
  } catch {
    try {
      console.warn(
        JSON.stringify({
          event: 'commerce.klarna_checkout.runtime_log_failed',
          stage: input.stage
        })
      )
    } catch {}
  }
}
