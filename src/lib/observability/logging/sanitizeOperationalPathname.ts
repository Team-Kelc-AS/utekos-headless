const potentiallyIdentifyingSegment =
  /@|%40|\d{6,}|^[0-9a-f]{16,}$|^[0-9a-f-]{32,}$/i

export function sanitizeOperationalPathname(
  value: string
): string {
  let pathname: string

  try {
    pathname = new URL(value, 'https://utekos.no').pathname
  } catch {
    return '/invalid'
  }

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 4)
    .map(segment => {
      if (
        segment.length > 64 ||
        potentiallyIdentifyingSegment.test(segment)
      ) {
        return ':dynamic'
      }

      return segment
    })

  return segments.length > 0 ? `/${segments.join('/')}` : '/'
}
