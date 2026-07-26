import { NextRequest, NextResponse, after } from 'next/server'
import {
  clientLogPayloadSchema,
  toAppLogInput
} from '@/lib/observability/logging/clientLogPayloadSchema'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import { reportAppLogToSentry } from '@/lib/observability/logging/reportAppLogToSentry'

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

    const logEntry = await logToAppLogs(
      toAppLogInput(parsedBody.data)
    )

    after(async () => {
      await reportAppLogToSentry(logEntry).catch(() => {
        console.warn('Client error report delivery failed')
      })
    })

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
