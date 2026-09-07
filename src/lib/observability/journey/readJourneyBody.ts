export const JOURNEY_MAX_BODY_BYTES = 8 * 1024

export async function readJourneyBody(
  request: Request
): Promise<
  | { body: string }
  | {
      error: 'payload_too_large' | 'invalid_body'
      status: 400 | 413
    }
> {
  const declared = request.headers.get('content-length')
  if (declared !== null && !/^\d+$/.test(declared)) {
    return { error: 'invalid_body', status: 400 }
  }
  if (Number(declared) > JOURNEY_MAX_BODY_BYTES) {
    return { error: 'payload_too_large', status: 413 }
  }
  if (!request.body)
    return { error: 'invalid_body', status: 400 }

  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let length = 0
  let body = ''
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      length += part.value.byteLength
      if (length > JOURNEY_MAX_BODY_BYTES) {
        await reader.cancel()
        return { error: 'payload_too_large', status: 413 }
      }
      body += decoder.decode(part.value, { stream: true })
    }
    return { body: body + decoder.decode() }
  } catch {
    return { error: 'invalid_body', status: 400 }
  } finally {
    reader.releaseLock()
  }
}
