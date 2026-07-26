import {
  NEWSLETTER_MODAL_LOCAL_STORAGE_KEY,
  NEWSLETTER_MODAL_SESSION_STORAGE_KEY,
  getNewsletterModalStorageMode,
  isNewsletterModalSuppressed,
  shouldBypassCookiebotGate
} from './newsletterModalConfig'

export type CookiebotConsent = { preferences?: boolean }

export type CookiebotApi = {
  hasResponse?: boolean
  consent?: CookiebotConsent
}

export type CookiebotWindow = Window & {
  Cookiebot?: CookiebotApi
}

type StorageLike = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

type NewsletterModalRuntimeInput = {
  cookiebot: CookiebotApi | undefined
  hostname: string
  nodeEnvironment: string | undefined
  cookieBannerVisible: boolean
  localDismissedAt: string | null
  sessionDismissedAt: string | null
  now?: number
}

export type NewsletterModalRuntimeState = {
  canOpen: boolean
  preferencesConsentGranted: boolean
  cookiebotResolved: boolean
  developmentBypassActive: boolean
  suppressed: boolean
}

export function hasCookiebotResolved(
  cookiebot: CookiebotApi | undefined
): boolean {
  return cookiebot?.hasResponse === true
}

export function hasCookiebotPreferencesConsent(
  cookiebot: CookiebotApi | undefined
): boolean {
  return cookiebot?.consent?.preferences === true
}

export function getNewsletterModalRuntimeState({
  cookiebot,
  hostname,
  nodeEnvironment,
  cookieBannerVisible,
  localDismissedAt,
  sessionDismissedAt,
  now
}: NewsletterModalRuntimeInput): NewsletterModalRuntimeState {
  const evaluatedAt = now ?? Date.now()

  const preferencesConsentGranted =
    hasCookiebotPreferencesConsent(cookiebot)

  const cookiebotResolved = hasCookiebotResolved(cookiebot)

  const developmentBypassActive = shouldBypassCookiebotGate(
    hostname,
    nodeEnvironment
  )

  const localSuppressed =
    preferencesConsentGranted &&
    isNewsletterModalSuppressed(localDismissedAt, evaluatedAt)

  const sessionSuppressed = isNewsletterModalSuppressed(
    sessionDismissedAt,
    evaluatedAt
  )

  const suppressed = localSuppressed || sessionSuppressed

  const consentGatePassed =
    cookiebotResolved || developmentBypassActive

  const canOpen =
    consentGatePassed && !cookieBannerVisible && !suppressed

  return {
    canOpen,
    preferencesConsentGranted,
    cookiebotResolved,
    developmentBypassActive,
    suppressed
  }
}

export function safelyReadStorage(
  storage: StorageLike | undefined,
  key: string
): string | null {
  if (!storage) {
    return null
  }

  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

export function safelyWriteStorage(
  storage: StorageLike | undefined,
  key: string,
  value: string
): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safelyRemoveStorage(
  storage: StorageLike | undefined,
  key: string
): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function readNewsletterModalDismissals(
  localStorage: StorageLike | undefined,
  sessionStorage: StorageLike | undefined
): {
  localDismissedAt: string | null
  sessionDismissedAt: string | null
} {
  return {
    localDismissedAt: safelyReadStorage(
      localStorage,
      NEWSLETTER_MODAL_LOCAL_STORAGE_KEY
    ),
    sessionDismissedAt: safelyReadStorage(
      sessionStorage,
      NEWSLETTER_MODAL_SESSION_STORAGE_KEY
    )
  }
}

export function persistNewsletterModalDismissal({
  localStorage,
  sessionStorage,
  preferencesConsentGranted,
  dismissedAt = Date.now()
}: {
  localStorage: StorageLike | undefined
  sessionStorage: StorageLike | undefined
  preferencesConsentGranted: boolean
  dismissedAt?: number
}): boolean {
  const timestamp = dismissedAt.toString()

  const storageMode = getNewsletterModalStorageMode(
    preferencesConsentGranted
  )

  if (storageMode === 'local') {
    const persisted = safelyWriteStorage(
      localStorage,
      NEWSLETTER_MODAL_LOCAL_STORAGE_KEY,
      timestamp
    )

    if (persisted) {
      safelyRemoveStorage(
        sessionStorage,
        NEWSLETTER_MODAL_SESSION_STORAGE_KEY
      )

      return true
    }
  }

  return safelyWriteStorage(
    sessionStorage,
    NEWSLETTER_MODAL_SESSION_STORAGE_KEY,
    timestamp
  )
}

export function getCookiebotFromWindow(
  browserWindow: Window
): CookiebotApi | undefined {
  return (browserWindow as CookiebotWindow).Cookiebot
}

export function isCookiebotBannerVisible(
  browserDocument: Document,
  browserWindow: Window
): boolean {
  const dialog = browserDocument.getElementById(
    'CybotCookiebotDialog'
  )

  if (!(dialog instanceof HTMLElement)) {
    return false
  }

  const styles = browserWindow.getComputedStyle(dialog)

  if (
    styles.display === 'none' ||
    styles.visibility === 'hidden' ||
    styles.opacity === '0' ||
    dialog.getAttribute('aria-hidden') === 'true'
  ) {
    return false
  }

  return dialog.getClientRects().length > 0
}
