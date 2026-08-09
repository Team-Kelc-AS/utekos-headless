export const NEWSLETTER_DISCOUNT_CODE = 'STAYCOMFY'
export const NEWSLETTER_DISCOUNT_AMOUNT_NOK = 200

export const NEWSLETTER_MODAL_LOCAL_STORAGE_KEY =
  'utekos-newsletter-modal-dismissed-at'

export const NEWSLETTER_MODAL_SESSION_STORAGE_KEY =
  'utekos-newsletter-modal-dismissed-session'

export const NEWSLETTER_MODAL_SUPPRESSION_MS =
  30 * 24 * 60 * 60 * 1000

const EXCLUDED_NEWSLETTER_MODAL_PATHS = [
  '/design',
  '/personvern',
  '/produkter/utekos-dun',
  '/skreddersy-varmen'
] as const

export type NewsletterModalStorageMode = 'local' | 'session'

export function isNewsletterModalExcludedPath(
  pathname: string | null
): boolean {
  if (!pathname) {
    return false
  }

  return EXCLUDED_NEWSLETTER_MODAL_PATHS.some(
    excludedPath =>
      pathname === excludedPath ||
      pathname.startsWith(`${excludedPath}/`)
  )
}

export function isNewsletterModalSuppressed(
  dismissedAt: string | null,
  now = Date.now()
): boolean {
  if (!dismissedAt) {
    return false
  }

  const parsedDismissedAt = Number.parseInt(dismissedAt, 10)

  if (!Number.isFinite(parsedDismissedAt)) {
    return false
  }

  return (
    now - parsedDismissedAt >= 0 &&
    now - parsedDismissedAt <= NEWSLETTER_MODAL_SUPPRESSION_MS
  )
}

export function getNewsletterModalStorageMode(
  preferencesConsentGranted: boolean
): NewsletterModalStorageMode {
  return preferencesConsentGranted ? 'local' : 'session'
}

export function shouldBypassCookiebotGate(
  hostname: string,
  nodeEnvironment: string | undefined
): boolean {
  if (nodeEnvironment !== 'development') {
    return false
  }

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  )
}
