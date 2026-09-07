import { sanitizeOperationalPathname } from '../logging/sanitizeOperationalPathname'

export function sanitizeJourneyPath(value: string): string {
  const path = sanitizeOperationalPathname(value)
  const sensitive =
    /\/(?:checkouts?|orders?|account|auth|kunde|api)(?:\/|$)/i
  if (sensitive.test(path)) return '/:private'

  return path
    .split('/')
    .map(segment => {
      if (segment === ':dynamic' || segment === ':private')
        return segment
      return /^[a-zA-Z0-9æøåÆØÅ_-]{0,64}$/.test(segment) ?
          segment
        : ':dynamic'
    })
    .join('/')
}
