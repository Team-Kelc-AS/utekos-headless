export const KLARNA_FEED_HOST = 'feed.utekos.no'

export function isKlarnaFeedHost(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase().replace(/\.$/, '')

  return (
    normalizedHost === KLARNA_FEED_HOST
    || normalizedHost === `www.${KLARNA_FEED_HOST}`
  )
}
