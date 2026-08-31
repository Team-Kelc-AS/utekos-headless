import { createShopifyTimeoutError } from './createShopifyTimeoutError'

export type ShopifyRequestDeadline = {
  readonly signal: AbortSignal
  readonly didTimeout: boolean
  race<T>(promise: Promise<T>): Promise<T>
  abort(): void
  dispose(): void
}

function throwAbortReason(reason: unknown): never {
  throw reason
}

export function createShopifyRequestDeadline(input: {
  timeoutMs: number
  callerSignal?: AbortSignal
}): ShopifyRequestDeadline {
  if (!Number.isFinite(input.timeoutMs) || input.timeoutMs <= 0) {
    throw new Error(
      'Shopify Storefront timeout must be greater than 0 ms.'
    )
  }

  const controller = new AbortController()
  const timeoutError = createShopifyTimeoutError()
  const state: {
    cancelled: boolean
    didTimeout: boolean
    disposed: boolean
    reason: unknown
    transportAbortScheduled: boolean
  } = {
    cancelled: false,
    didTimeout: false,
    disposed: false,
    reason: undefined,
    transportAbortScheduled: false
  }

  let rejectCancellation: (reason: unknown) => void = () => {}
  const cancellation = new Promise<never>((_, reject) => {
    rejectCancellation = reject
  })

  // A deadline can fire between the fetch and body-read races. Keep the
  // rejection handled while no request phase is awaiting it.
  void cancellation.catch(() => undefined)

  const scheduleTransportAbort = (reason: unknown) => {
    if (
      state.transportAbortScheduled ||
      controller.signal.aborted
    ) {
      return
    }

    state.transportAbortScheduled = true
    setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(reason)
      }
    }, 0)
  }

  const cancel = (reason: unknown, didTimeout: boolean) => {
    if (state.cancelled) return

    state.cancelled = true
    state.didTimeout = didTimeout
    state.reason = reason

    // Settle the wall-clock deadline before transport cleanup. Abort
    // listeners run synchronously and can otherwise delay the visible timeout
    // while a stalled fetch or response body attempts to clean itself up.
    rejectCancellation(reason)
    scheduleTransportAbort(reason)
  }

  const timeoutId = setTimeout(() => {
    cancel(timeoutError, true)
  }, input.timeoutMs)

  const onCallerAbort = () => {
    cancel(input.callerSignal?.reason, false)
  }

  if (input.callerSignal) {
    if (input.callerSignal.aborted) {
      onCallerAbort()
    } else {
      input.callerSignal.addEventListener('abort', onCallerAbort, {
        once: true
      })
    }
  }

  return {
    signal: controller.signal,
    get didTimeout() {
      return state.didTimeout
    },
    async race<T>(promise: Promise<T>): Promise<T> {
      if (state.cancelled) {
        throwAbortReason(state.reason ?? timeoutError)
      }

      return Promise.race([promise, cancellation])
    },
    abort() {
      cancel(timeoutError, true)
    },
    dispose() {
      if (state.disposed) {
        return
      }

      state.disposed = true
      clearTimeout(timeoutId)
      input.callerSignal?.removeEventListener('abort', onCallerAbort)
    }
  }
}
