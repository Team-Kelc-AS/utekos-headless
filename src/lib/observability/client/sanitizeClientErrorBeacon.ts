import { sanitizeOperationalPathname } from '@/lib/observability/logging/sanitizeOperationalPathname'

const KNOWN_ERROR =
  /\b(?:AbortError|TypeError|ReferenceError|SyntaxError|RangeError|TimeoutError|URIError|ZodError|Error)\b/

export function sanitizeClientErrorMessage(
  message: string
): string {
  return message.match(KNOWN_ERROR)?.[0] ?? 'ClientError'
}

export function sanitizeClientErrorFilename(
  filename: string
): string {
  return sanitizeOperationalPathname(filename)
}
