import { extractFbclidFromFbc } from '@/lib/analytics/extractFbclidFromFbc'

const META_REFERRER_DOMAINS = [
  'facebook.com',
  'fb.com',
  'fb.me',
  'instagram.com',
  'messenger.com',
  'threads.net'
] as const

export type FacebookLoginTrafficSignal =
  | 'fbclid'
  | 'fbc'
  | 'meta_referrer'

function readCookie(cookieHeader: string, name: string) {
  const prefix = `${name}=`

  for (const part of cookieHeader.split(';')) {
    const candidate = part.trim()
    if (!candidate.startsWith(prefix)) continue

    const value = candidate.slice(prefix.length)
    if (!value) return undefined

    try {
      return decodeURIComponent(value)
    } catch {
      return undefined
    }
  }

  return undefined
}

export function isMetaReferrer(referrer: string) {
  if (!referrer) return false

  let hostname: string
  try {
    hostname = new URL(referrer).hostname.toLowerCase()
  } catch {
    return false
  }

  return META_REFERRER_DOMAINS.some(
    domain =>
      hostname === domain || hostname.endsWith(`.${domain}`)
  )
}

export function detectFacebookLoginTraffic(input: {
  cookieHeader?: string
  pageUrl: string
  referrer?: string
}): FacebookLoginTrafficSignal | undefined {
  try {
    const fbclid = new URL(input.pageUrl).searchParams
      .get('fbclid')
      ?.trim()
    if (fbclid) return 'fbclid'
  } catch {}

  const fbc = readCookie(input.cookieHeader ?? '', '_fbc')
  if (extractFbclidFromFbc(fbc)) return 'fbc'

  if (isMetaReferrer(input.referrer ?? '')) {
    return 'meta_referrer'
  }

  return undefined
}
