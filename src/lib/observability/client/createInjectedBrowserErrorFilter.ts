export type ClientErrorDetails = {
  message: string
  source?: string | undefined
  stack?: string | undefined
}

const DEFAULT_PAIR_WINDOW_MS = 2_000
const INJECTED_AUTOFILL_ERROR =
  /^(?:Uncaught )?ReferenceError: Can't find variable: _AutofillCallbackHandler$/u
const REACT_HTML_HYDRATION_ERROR =
  'react.dev/errors/418?args[]=HTML&args[]='

export function createInjectedBrowserErrorFilter(
  options: { now?: () => number; pairWindowMs?: number } = {}
) {
  const now = options.now ?? Date.now
  const pairWindowMs =
    options.pairWindowMs ?? DEFAULT_PAIR_WINDOW_MS
  let lastInjectedAutofillErrorAt: number | undefined

  return ({ message }: ClientErrorDetails): boolean => {
    const observedAt = now()

    if (INJECTED_AUTOFILL_ERROR.test(message)) {
      lastInjectedAutofillErrorAt = observedAt
      return true
    }

    if (
      !message.includes(REACT_HTML_HYDRATION_ERROR) ||
      lastInjectedAutofillErrorAt === undefined
    ) {
      return false
    }

    const elapsed = observedAt - lastInjectedAutofillErrorAt
    return elapsed >= 0 && elapsed <= pairWindowMs
  }
}
