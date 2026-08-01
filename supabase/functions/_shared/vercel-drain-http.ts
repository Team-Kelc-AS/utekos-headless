import { verifyVercelSignature } from './vercel-drain-crypto.ts'

export const drainResponseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8'
}

class BodyTooLargeError extends Error {}

export function jsonDrainResponse(
  body: Record<string, unknown>,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    headers: drainResponseHeaders,
    status
  })
}

function readDeclaredBodySize(request: Request): number | null {
  const value = request.headers.get('content-length')
  if (!value) return null
  if (!/^\d+$/.test(value)) return Number.NaN

  return Number(value)
}

async function readBoundedBody(
  request: Request,
  maximumBytes: number
): Promise<Uint8Array> {
  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > maximumBytes) {
        await reader.cancel()
        throw new BodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return body
}

export type SignedJsonDrainResult =
  | { success: true; parsedBody: unknown }
  | { success: false; response: Response }

export async function readSignedJsonDrainRequest(
  request: Request,
  signatureSecret: string,
  maximumBytes: number
): Promise<SignedJsonDrainResult> {
  if (request.method !== 'POST') {
    return {
      success: false,
      response: new Response(
        JSON.stringify({ code: 'method_not_allowed' }),
        {
          headers: { ...drainResponseHeaders, Allow: 'POST' },
          status: 405
        }
      )
    }
  }

  const contentType =
    request.headers.get('content-type')?.toLowerCase() ?? ''
  const contentEncoding = request.headers
    .get('content-encoding')
    ?.toLowerCase()
  if (!contentType.startsWith('application/json')) {
    return {
      success: false,
      response: jsonDrainResponse(
        { code: 'unsupported_media_type' },
        415
      )
    }
  }
  if (contentEncoding && contentEncoding !== 'identity') {
    return {
      success: false,
      response: jsonDrainResponse(
        { code: 'unsupported_content_encoding' },
        415
      )
    }
  }

  const declaredBodySize = readDeclaredBodySize(request)
  if (Number.isNaN(declaredBodySize)) {
    return {
      success: false,
      response: jsonDrainResponse(
        { code: 'invalid_content_length' },
        400
      )
    }
  }
  if (
    declaredBodySize !== null &&
    declaredBodySize > maximumBytes
  ) {
    return {
      success: false,
      response: jsonDrainResponse(
        { code: 'payload_too_large' },
        413
      )
    }
  }

  let rawBody: Uint8Array
  try {
    rawBody = await readBoundedBody(request, maximumBytes)
  } catch (error) {
    return {
      success: false,
      response: jsonDrainResponse(
        {
          code:
            error instanceof BodyTooLargeError ?
              'payload_too_large'
            : 'body_read_failed'
        },
        error instanceof BodyTooLargeError ? 413 : 400
      )
    }
  }

  const signatureIsValid = await verifyVercelSignature(
    rawBody,
    request.headers.get('x-vercel-signature'),
    signatureSecret
  )
  if (!signatureIsValid) {
    return {
      success: false,
      response: jsonDrainResponse(
        { code: 'invalid_signature' },
        403
      )
    }
  }

  try {
    return {
      parsedBody: JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(rawBody)
      ),
      success: true
    }
  } catch {
    return {
      success: false,
      response: jsonDrainResponse({ code: 'invalid_json' }, 400)
    }
  }
}
