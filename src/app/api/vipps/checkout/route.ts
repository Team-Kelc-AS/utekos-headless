import {
  createVippsCheckout,
  vippsCheckoutInputSchema
} from '@/lib/vipps/createCheckout'
import { getVippsRuntime } from '@/lib/vipps/runtime'
import { vippsRateLimit } from '@/lib/vipps/rateLimit'

export const maxDuration = 60
export async function POST(request: Request) {
  try {
    if (process.env.VIPPS_EXPRESS_ENABLED !== 'true')
      return new Response(null, { status: 503 })
    const { origin, secret } = getVippsRuntime()
    if (request.headers.get('origin') !== origin)
      return new Response(null, { status: 403 })
    const body = await request.text()
    if (Buffer.byteLength(body) > 4096)
      return new Response(null, { status: 413 })
    const input = vippsCheckoutInputSchema.safeParse(
      JSON.parse(body)
    )
    if (!input.success)
      return new Response(null, { status: 400 })
    const ip =
      request.headers.get('x-vercel-forwarded-for') ??
      request.headers.get('x-forwarded-for') ??
      'unknown'
    if (!(await vippsRateLimit('create', ip, 10, 300, secret)))
      return new Response(null, {
        status: 429,
        headers: { 'Retry-After': '60' }
      })
    const result = await createVippsCheckout(input.data)
    return Response.json(result, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    console.error(
      'vipps.checkout.creation_failed',
      error instanceof Error ? error.message : 'unknown_error'
    )
    return Response.json(
      {
        message:
          'Vi kunne ikke starte Vipps-betalingen. Prøv igjen med samme bestilling.'
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
