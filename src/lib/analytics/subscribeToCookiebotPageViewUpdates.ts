const COOKIEBOT_PAGE_VIEW_EVENTS = [
  'CookiebotOnConsentReady',
  'CookiebotOnAccept',
  'CookiebotOnDecline'
] as const

type CookiebotPageViewEventTarget = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>

type RecoveryTimer = ReturnType<typeof setTimeout> | number

type CookiebotPageViewSubscription = {
  eventTarget: CookiebotPageViewEventTarget
  flush: () => Promise<unknown>
  observeConsent: () => void
  documentTarget?: CookiebotPageViewEventTarget
  isVisible?: () => boolean
  schedule?: (
    callback: () => void,
    delay: number
  ) => RecoveryTimer
  cancel?: (timer: RecoveryTimer) => void
}

export function subscribeToCookiebotPageViewUpdates(
  subscription: CookiebotPageViewSubscription
) {
  const schedule = subscription.schedule ?? setTimeout
  const cancel = subscription.cancel ?? clearTimeout
  const timers = new Set<RecoveryTimer>()
  let active = true
  let remainingRecoveryChecks = 20

  const reconcile = () => {
    if (!active) return
    runConsentStep(
      subscription.observeConsent,
      'consent_processing_failed'
    )
    runConsentStep(() => {
      void subscription
        .flush()
        .then(result => {
          if (result === 'failed')
            reportConsentDiagnostic('collector_failed')
          if (result === 'sent')
            reportConsentDiagnostic('collector_sent')
        })
        .catch(() => reportConsentDiagnostic('collector_failed'))
    }, 'collector_failed')
  }

  const scheduleRecovery = (delays: number[]) => {
    for (const timer of timers) cancel(timer)
    timers.clear()
    for (const delay of delays) {
      if (remainingRecoveryChecks <= timers.size) break
      const timer = schedule(() => {
        timers.delete(timer)
        if (!active || remainingRecoveryChecks-- <= 0) return
        reconcile()
      }, delay)
      timers.add(timer)
    }
  }

  const handleConsentUpdate = () => {
    reconcile()
    scheduleRecovery([250, 1_000, 5_000])
  }
  const handleVisible = () => {
    if (subscription.isVisible?.() !== false)
      handleConsentUpdate()
  }

  for (const eventName of COOKIEBOT_PAGE_VIEW_EVENTS) {
    subscription.eventTarget.addEventListener(
      eventName,
      handleConsentUpdate
    )
  }

  subscription.eventTarget.addEventListener(
    'online',
    handleVisible
  )
  subscription.eventTarget.addEventListener(
    'pageshow',
    handleVisible
  )
  subscription.documentTarget?.addEventListener(
    'visibilitychange',
    handleVisible
  )
  scheduleRecovery([0, 1_000, 5_000, 15_000, 30_000])

  return () => {
    active = false
    for (const timer of timers) cancel(timer)
    timers.clear()
    subscription.eventTarget.removeEventListener(
      'online',
      handleVisible
    )
    subscription.eventTarget.removeEventListener(
      'pageshow',
      handleVisible
    )
    subscription.documentTarget?.removeEventListener(
      'visibilitychange',
      handleVisible
    )
    for (const eventName of COOKIEBOT_PAGE_VIEW_EVENTS) {
      subscription.eventTarget.removeEventListener(
        eventName,
        handleConsentUpdate
      )
    }
  }
}
import { reportConsentDiagnostic } from '@/lib/observability/client/reportConsentDiagnostic'
import { runConsentStep } from './runConsentStep'
