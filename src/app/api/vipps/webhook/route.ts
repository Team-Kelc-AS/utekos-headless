import { z } from 'zod'
import { getVippsRuntime } from '@/lib/vipps/runtime'
import { verifyVippsWebhook } from '@/lib/vipps/verifyWebhook'
import { reconcileVippsCheckout } from '@/lib/vipps/reconcileCheckout'
import { vippsReferenceSchema } from '@/lib/vipps/payment'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { config, origin } = getVippsRuntime()
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody) > 65536)
      return new Response(null, { status: 413 })
    if (
      !verifyVippsWebhook({
        rawBody,
        headers: request.headers,
        requestUrl: request.url,
        registeredUrl: `${origin}/api/vipps/webhook`,
        secret: process.env.VIPPS_WEBHOOK_SECRET ?? ''
      })
    ) {
      return new Response(null, { status: 401 })
    }
    const event = z
      .object({
        msn: z.union([z.string(), z.number()]),
        reference: vippsReferenceSchema,
        name: z.string(),
        success: z.boolean()
      })
      .safeParse(JSON.parse(rawBody))
    if (!event.success || String(event.data.msn) !== config.msn)
      return new Response(null, { status: 400 })
    // Other sales on the same MSN belong to other integrations. Never modify them.
    if (!event.data.reference.startsWith('utekos-express-'))
      return new Response(null, { status: 200 })
    // The event is only a wake-up signal. The GET payment response decides whether to capture/mark paid.
    await reconcileVippsCheckout(event.data.reference)
    return new Response(null, { status: 200 })
  } catch {
    // Do not acknowledge work that hasn't completed. Vipps retries; the durable ledger and
    // stable capture key make repeat deliveries safe. No background work after a response.
    console.error('vipps.webhook.reconciliation_failed')
    return new Response(null, {
      status: 503,
      headers: { 'Retry-After': '5' }
    })
  }
}
