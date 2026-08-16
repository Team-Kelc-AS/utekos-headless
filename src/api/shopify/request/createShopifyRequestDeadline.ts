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
  const state = { didTimeout: false, disposed: false }

  const timeoutId = setTimeout(() => {
    state.didTimeout = true
    if (!controller.signal.aborted) {
      controller.abort(timeoutError)
    }
  }, input.timeoutMs)

  const onCallerAbort = () => {
    if (!controller.signal.aborted) {
      controller.abort(input.callerSignal?.reason)
    }
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
      if (controller.signal.aborted) {
        throwAbortReason(controller.signal.reason ?? timeoutError)
      }

      let onAbort: (() => void) | undefined

      try {
        return await Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            onAbort = () => {
              reject(controller.signal.reason ?? timeoutError)
            }
            controller.signal.addEventListener('abort', onAbort, {
              once: true
            })
          })
        ])
      } finally {
        if (onAbort) {
          controller.signal.removeEventListener('abort', onAbort)
        }
      }
    },
    abort() {
      state.didTimeout = true
      if (!controller.signal.aborted) {
        controller.abort(timeoutError)
      }
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
