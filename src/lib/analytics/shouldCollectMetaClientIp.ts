import { resolveTrackingEnvironment } from './resolveTrackingEnvironment'

export function shouldCollectMetaClientIp(
  pageUrl: string,
  nodeEnvironment: string | undefined
) {
  const hostname = new URL(pageUrl).hostname.toLowerCase()
  if (hostname === '::1') return false

  const environment = resolveTrackingEnvironment(
    pageUrl,
    nodeEnvironment
  )
  return (
    environment === 'production' || environment === 'preview'
  )
}
