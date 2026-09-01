import { ipAddress } from '@vercel/functions'
import { NextResponse, type NextRequest } from 'next/server'
import {
  metaClientIpRequestSchema,
  metaClientIpResponseSchema
} from '@/lib/analytics/metaClientIpContract'

const MAX_BODY_BYTES = 4 * 1024
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'Vary': 'Cookie'
}

function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

function hasJsonMediaType(request: Request) {
  return (
    request.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase() === 'application/json'
  )
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: 'forbidden_origin' },
      { headers: NO_STORE_HEADERS, status: 403 }
    )
  }

  if (!hasJsonMediaType(request)) {
    return NextResponse.json(
      { error: 'unsupported_media_type' },
      { headers: NO_STORE_HEADERS, status: 415 }
    )
  }

  const declaredLength = Number(
    request.headers.get('content-length') ?? 0
  )
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'payload_too_large' },
      { headers: NO_STORE_HEADERS, status: 413 }
    )
  }

  const body = await request.text()
  if (
    new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES
  ) {
    return NextResponse.json(
      { error: 'payload_too_large' },
      { headers: NO_STORE_HEADERS, status: 413 }
    )
  }

  let input: unknown
  try {
    input = JSON.parse(body)
  } catch {
    return NextResponse.json(
      { error: 'invalid_json' },
      { headers: NO_STORE_HEADERS, status: 400 }
    )
  }

  if (!metaClientIpRequestSchema.safeParse(input).success) {
    return NextResponse.json(
      { error: 'invalid_context' },
      { headers: NO_STORE_HEADERS, status: 400 }
    )
  }

  const clientIpAddress = ipAddress(request)
  if (!clientIpAddress) {
    return NextResponse.json(
      { error: 'client_ip_unavailable' },
      { headers: NO_STORE_HEADERS, status: 503 }
    )
  }

  return NextResponse.json(
    metaClientIpResponseSchema.parse({
      client_ip_address: clientIpAddress
    }),
    { headers: NO_STORE_HEADERS }
  )
}
