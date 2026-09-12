const DEFAULT_IDLE_TIMEOUT_MS = 4_000
const DEFAULT_LCP_FALLBACK_MS = 4_000

export type AssistantRuntimePrefetchScheduler = {
  cancelIdleCallback?: (handle: number) => void
  clearTimeout: (handle: number) => void
  observeLargestContentfulPaint?: (
    onLcp: () => void
  ) => () => void
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number }
  ) => number
  setTimeout: (callback: () => void, delay: number) => number
}

function createBrowserPrefetchScheduler(): AssistantRuntimePrefetchScheduler {
  const scheduler: AssistantRuntimePrefetchScheduler = {
    clearTimeout: handle => window.clearTimeout(handle),
    observeLargestContentfulPaint: onLcp => {
      if (typeof PerformanceObserver === 'undefined') {
        onLcp()
        return () => {}
      }

      let notified = false
      const notify = () => {
        if (notified) return
        notified = true
        onLcp()
      }

      const observer = new PerformanceObserver(list => {
        if (list.getEntries().length > 0) notify()
      })

      try {
        observer.observe({
          type: 'largest-contentful-paint',
          buffered: true
        })
      } catch {
        notify()
        return () => {}
      }

      return () => observer.disconnect()
    },
    setTimeout: (callback, delay) =>
      window.setTimeout(callback, delay)
  }

  if (typeof window.cancelIdleCallback === 'function') {
    scheduler.cancelIdleCallback = handle =>
      window.cancelIdleCallback(handle)
  }

  if (typeof window.requestIdleCallback === 'function') {
    scheduler.requestIdleCallback = (callback, options) =>
      window.requestIdleCallback(callback, options)
  }

  return scheduler
}

export function scheduleAssistantRuntimePrefetch(
  prefetch: () => void,
  scheduler: AssistantRuntimePrefetchScheduler = createBrowserPrefetchScheduler()
): () => void {
  let cancelled = false
  let didPrefetch = false
  let idleHandle: number | undefined
  let fallbackHandle: number | undefined

  const runPrefetch = () => {
    if (cancelled || didPrefetch) return
    didPrefetch = true
    prefetch()
  }

  const scheduleIdle = () => {
    if (cancelled || didPrefetch) return

    if (scheduler.requestIdleCallback) {
      idleHandle = scheduler.requestIdleCallback(runPrefetch, {
        timeout: DEFAULT_IDLE_TIMEOUT_MS
      })
      return
    }

    fallbackHandle = scheduler.setTimeout(
      runPrefetch,
      DEFAULT_IDLE_TIMEOUT_MS
    )
  }

  if (scheduler.observeLargestContentfulPaint) {
    const disconnectLcp =
      scheduler.observeLargestContentfulPaint(() => {
        if (fallbackHandle !== undefined) {
          scheduler.clearTimeout(fallbackHandle)
          fallbackHandle = undefined
        }
        scheduleIdle()
      })

    fallbackHandle = scheduler.setTimeout(
      scheduleIdle,
      DEFAULT_LCP_FALLBACK_MS
    )

    return () => {
      cancelled = true
      disconnectLcp()
      if (
        idleHandle !== undefined &&
        scheduler.cancelIdleCallback
      ) {
        scheduler.cancelIdleCallback(idleHandle)
      }
      if (fallbackHandle !== undefined) {
        scheduler.clearTimeout(fallbackHandle)
      }
    }
  }

  scheduleIdle()

  return () => {
    cancelled = true
    if (
      idleHandle !== undefined &&
      scheduler.cancelIdleCallback
    ) {
      scheduler.cancelIdleCallback(idleHandle)
    }
    if (fallbackHandle !== undefined) {
      scheduler.clearTimeout(fallbackHandle)
    }
  }
}
