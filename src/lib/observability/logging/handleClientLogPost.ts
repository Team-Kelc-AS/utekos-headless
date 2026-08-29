import { NextResponse } from 'next/server'
import { toAppLogInput } from '@/lib/observability/logging/clientLogPayloadSchema'
import { parseClientLogRequestBody } from '@/lib/observability/logging/parseClientLogRequestBody'
import type { AppLogInput } from '@/lib/observability/logging/appLogContract'
import type { AppLogEntry } from 'types/observability/log/AppLogEntry'

const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_BODY_BYTES = 8 * 1024

export type ClientLogRouteDependencies = {
  authorizeHealthProbe?: (request: Request) => boolean
  log: (input: AppLogInput) => Promise<AppLogEntry>
}

function unreadablyRejectedResponse() {
  return new NextResponse(null, {
    headers: NO_STORE,
    status: 204
  })
}

export async function handleClientLogPost(
  request: Request,
  dependencies: ClientLogRouteDependencies
) {
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Invalid log payload' },
      { headers: NO_STORE, status: 413 }
    )
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return unreadablyRejectedResponse()
  }

  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Invalid log payload' },
      { headers: NO_STORE, status: 413 }
    )
  }

  const parsed = parseClientLogRequestBody(raw)
  switch (parsed.status) {
    case 'ok':
      break
    case 'unreadable':
      return unreadablyRejectedResponse()
    case 'invalid':
      return NextResponse.json(
        { error: 'Invalid log payload' },
        { headers: NO_STORE, status: 400 }
      )
    default: {
      const _exhaustive: never = parsed
      void _exhaustive
      return unreadablyRejectedResponse()
    }
  }

  if (
    parsed.payload.event === 'client_health_probe' &&
    dependencies.authorizeHealthProbe?.(request) !== true
  ) {
    return NextResponse.json(
      { error: 'Unauthorized health probe' },
      { headers: NO_STORE, status: 401 }
    )
  }

  try {
    await dependencies.log(toAppLogInput(parsed.payload))
  } catch {
    console.error('Client logger failed to persist a valid payload')
    return NextResponse.json(
      { error: 'Log persistence failed' },
      { headers: NO_STORE, status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}
