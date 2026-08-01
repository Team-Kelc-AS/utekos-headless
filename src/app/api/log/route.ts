import { NextRequest, NextResponse } from 'next/server'
import {
  clientLogPayloadSchema,
  toAppLogInput
} from '@/lib/observability/logging/clientLogPayloadSchema'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

export async function POST(req: NextRequest) {
  try {
    const parsedBody = clientLogPayloadSchema.safeParse(
      await req.json()
    )
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid log payload' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    await logToAppLogs(toAppLogInput(parsedBody.data))

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    console.error('Client logger rejected an unreadable request')
    return NextResponse.json(
      { error: 'Invalid log payload' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
