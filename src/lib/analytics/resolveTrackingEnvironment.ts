import type { TrackingEnvironment } from './pageViewEvent'
export function resolveTrackingEnvironment(
  pageUrl: string,
  nodeEnvironment: string | undefined
): TrackingEnvironment {
  if (nodeEnvironment === 'test') {
    return 'test'
  }

  const hostname = new URL(pageUrl).hostname.toLowerCase()

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development'
  }

  if (nodeEnvironment !== 'production') {
    return 'development'
  }

  return (
      hostname === 'utekos.no' || hostname === 'www.utekos.no'
    ) ?
      'production'
    : 'preview'
}
