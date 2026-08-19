import { NextResponse } from 'next/server'
import { parseCspReport } from '@/lib/security/parseCspReport'
import { shouldLogCspReport } from '@/lib/security/shouldLogCspReport'

const MAX_REPORT_BYTES = 32 * 1024

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 })

  const body = await request.text()
  if (Buffer.byteLength(body) > MAX_REPORT_BYTES) return new NextResponse(null, { status: 413 })

  try {
    const report = parseCspReport(JSON.parse(body))
    if (shouldLogCspReport(report)) {
      console.warn('csp-report', JSON.stringify(report))
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Invalid CSP report' }, { status: 400 })
  }
}
