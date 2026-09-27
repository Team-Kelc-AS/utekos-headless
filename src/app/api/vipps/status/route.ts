import { z } from 'zod'
import {
  getVippsRuntime,
  verifyVippsStatusToken
} from '@/lib/vipps/runtime'
import { vippsReferenceSchema } from '@/lib/vipps/payment'
import { reconcileVippsCheckout } from '@/lib/vipps/reconcileCheckout'
import { vippsRateLimit } from '@/lib/vipps/rateLimit'

export const maxDuration = 60
export async function POST(request: Request) {
  try {
    const { origin, secret } = getVippsRuntime()
    if (request.headers.get('origin') !== origin)
      return new Response(null, { status: 403 })
    const body = await request.text()
    if (Buffer.byteLength(body) > 4096)
      return new Response(null, { status: 413 })
    const parsed = z
      .object({
        reference: vippsReferenceSchema,
        token: z.string().max(100)
      })
      .safeParse(JSON.parse(body))
    if (
      !parsed.success ||
      !verifyVippsStatusToken(
        parsed.data.reference,
        parsed.data.token,
        secret
      )
    )
      return new Response(null, { status: 403 })
    if (
      !(await vippsRateLimit(
        'status',
        parsed.data.reference,
        25,
        60,
        secret
      ))
    )
      return new Response(null, {
        status: 429,
        headers: { 'Retry-After': '5' }
      })
    const result = await reconcileVippsCheckout(
      parsed.data.reference
    )
    // No profile/address/payment credentials returned to the browser.
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return Response.json(
      {
        status: 'pending',
        message:
          'Betalingen kontrolleres. Ikke start en ny betaling.'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '5'
        }
      }
    )
  }
}
