import { sanitizeOperationalPathname } from '@/lib/observability/logging/sanitizeOperationalPathname'

const EMAIL_LIKE = /\S+@\S+\.\S+/g
const MAX_MESSAGE_LENGTH = 240

export function sanitizeClientErrorMessage(
  message: string
): string {
  return message
    .replace(EMAIL_LIKE, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH)
}

export function sanitizeClientErrorFilename(
  filename: string
): string {
  return sanitizeOperationalPathname(filename)
}
