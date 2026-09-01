const COOKIEBOT_PAGE_VIEW_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

type CookiebotPageViewEventTarget = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>

type CookiebotPageViewSubscription = {
  eventTarget: CookiebotPageViewEventTarget
  flush: () => Promise<unknown>
  observeConsent: () => void
}

export function subscribeToCookiebotPageViewUpdates(
  subscription: CookiebotPageViewSubscription
) {
  const handleConsentUpdate = () => {
    subscription.observeConsent()
    void subscription.flush().catch(() => undefined)
  }

  for (const eventName of COOKIEBOT_PAGE_VIEW_EVENTS) {
    subscription.eventTarget.addEventListener(
      eventName,
      handleConsentUpdate
    )
  }

  return () => {
    for (const eventName of COOKIEBOT_PAGE_VIEW_EVENTS) {
      subscription.eventTarget.removeEventListener(
        eventName,
        handleConsentUpdate
      )
    }
  }
}
