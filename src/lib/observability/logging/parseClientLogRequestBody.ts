import {
  clientLogPayloadSchema,
  type ClientLogPayload
} from '@/lib/observability/logging/clientLogPayloadSchema'

export type ClientLogBodyParseResult =
  | { status: 'ok'; payload: ClientLogPayload }
  | { status: 'unreadable' }
  | { status: 'invalid' }

export function parseClientLogRequestBody(
  raw: string
): ClientLogBodyParseResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { status: 'unreadable' }
  }

  let json: unknown
  try {
    json = JSON.parse(trimmed) as unknown
  } catch {
    return { status: 'unreadable' }
  }

  const parsed = clientLogPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return { status: 'invalid' }
  }

  return { status: 'ok', payload: parsed.data }
}
