import { sanitizeOperationalPathname } from '../logging/sanitizeOperationalPathname'

export function sanitizeJourneyPath(value: string): string {
  const sensitive =
    /\/(?:checkouts?|orders?|account|auth|kunde|api)(?:\/|$)/i
  let pathname: string
  try {
    pathname = new URL(value, 'https://utekos.no').pathname
  } catch {
    return '/:private'
  }
  if (pathname === '/:private' || sensitive.test(pathname))
    return '/:private'
  const path = sanitizeOperationalPathname(pathname)

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
