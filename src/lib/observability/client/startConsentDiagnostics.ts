import type { ConsentDiagnosticCode } from 'types/observability/log/ConsentDiagnosticCode'

type ConsentRuntime = {
  hasResponse?: boolean
  consented?: boolean
  declined?: boolean
}

export function startConsentDiagnostics(input: {
  target: Pick<
    EventTarget,
    'addEventListener' | 'removeEventListener'
  >
  getState: () => ConsentRuntime | undefined
  isDialogVisible: () => boolean
  report: (code: ConsentDiagnosticCode) => void
  schedule?: typeof setTimeout
  cancel?: typeof clearTimeout
}) {
  const schedule = input.schedule ?? setTimeout
  const cancel = input.cancel ?? clearTimeout
  const inspect = (finalCheck = false) => {
    try {
      const state = input.getState()
      if (
        state?.hasResponse === true ||
        state?.consented === true ||
        state?.declined === true
      ) {
        input.report('decision_observed')
      } else if (input.isDialogVisible()) {
        input.report('dialog_visible')
      } else if (state) {
        input.report('awaiting_decision')
      } else if (finalCheck) {
        input.report('cmp_unavailable')
      }
    } catch {
      input.report('consent_processing_failed')
    }
  }
  const onConsent = () => inspect()
  const events = [
    'CookiebotOnConsentReady',
    'CookiebotOnAccept',
    'CookiebotOnDecline'
  ]
  for (const event of events)
    input.target.addEventListener(event, onConsent)
  const timers = [0, 1_000, 5_000, 15_000, 30_000].map(delay =>
    schedule(() => inspect(delay === 30_000), delay)
  )
  return () => {
    for (const event of events)
      input.target.removeEventListener(event, onConsent)
    for (const timer of timers) cancel(timer)
  }
}
