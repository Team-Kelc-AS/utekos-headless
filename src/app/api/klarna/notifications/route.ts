import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null)

  const klarnaOrderId =
    req.nextUrl.searchParams.get('klarna_order_id') ||
    ((
      typeof body === 'object' &&
      body !== null &&
      'order_id' in body &&
      typeof (body as { order_id?: unknown }).order_id ===
        'string'
    ) ?
      (body as { order_id: string }).order_id
    : null)

  await logToAppLogs({
    event: 'klarna.notification_received',
    level: 'INFO',
    data: {
      hasOrderId: Boolean(klarnaOrderId),
      bodyShape:
        body === null ? 'null'
        : Array.isArray(body) ? 'array'
        : typeof body === 'object' ? 'object'
        : 'primitive'
    },
    context: {}
  })

  return NextResponse.json({ received: true })
}
