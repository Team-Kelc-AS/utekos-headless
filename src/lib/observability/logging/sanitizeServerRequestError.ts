import { z } from 'zod'
import { sanitizeOperationalPathname } from './sanitizeOperationalPathname'

const errorNameSchema = z.enum([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'AggregateError',
  'AbortError',
  'TimeoutError'
])
const methodSchema = z.enum([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS'
])
const digestSchema = z
  .string()
  .regex(/^(?:[0-9]{1,20}|[a-fA-F0-9-]{8,64})$/)
const requestIdSchema = z.string().uuid()

export function sanitizeServerRequestError(
  error: unknown,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  }
) {
  const name = errorNameSchema.safeParse(
    error instanceof Error ? error.name : undefined
  )
  const digest = digestSchema.safeParse(
    (
      typeof error === 'object' &&
        error !== null &&
        'digest' in error
    ) ?
      error.digest
    : undefined
  )
  const method = methodSchema.safeParse(request.method)
  const requestId = requestIdSchema.safeParse(
    request.headers['x-utekos-edge-request-id']
  )
  return {
    name: name.success ? name.data : 'ServerError',
    path: sanitizeOperationalPathname(request.path),
    method: method.success ? method.data : 'OTHER',
    ...(digest.success ? { digest: digest.data } : {}),
    ...(requestId.success ? { requestId: requestId.data } : {})
  }
}
