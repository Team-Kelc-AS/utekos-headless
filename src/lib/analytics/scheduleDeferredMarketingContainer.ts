const DEFAULT_IDLE_TIMEOUT_MS = 4_000
const DEFAULT_LCP_FALLBACK_MS = 4_000
const CONSENT_OPEN_EVENT = 'utekos:consent:open'
const INTERACTION_EVENTS = [
  'pointerdown',
  'keydown',
  'touchstart'
] as const

export type DeferredMarketingContainerScheduler = {
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

export type DeferredMarketingContainerTarget = Pick<
  EventTarget,
  'addEventListener' | 'removeEventListener'
>

export type ScheduleDeferredMarketingContainerOptions = {
  eventTarget?: DeferredMarketingContainerTarget
  hasStoredDecision?: boolean
  scheduler?: DeferredMarketingContainerScheduler
}

function createBrowserScheduler(): DeferredMarketingContainerScheduler {
  const scheduler: DeferredMarketingContainerScheduler = {
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

export function scheduleDeferredMarketingContainer(
  load: () => void,
  options: ScheduleDeferredMarketingContainerOptions = {}
): () => void {
  if (options.hasStoredDecision) {
    load()
    return () => {}
  }

  const scheduler =
    options.scheduler ?? createBrowserScheduler()
  const eventTarget = options.eventTarget
  let cancelled = false
  let didLoad = false
  let idleHandle: number | undefined
  let fallbackHandle: number | undefined
  let disconnectLcp: (() => void) | undefined

  const runLoad = () => {
    if (cancelled || didLoad) return
    didLoad = true
    load()
  }

  const scheduleIdle = () => {
    if (cancelled || didLoad) return

    if (scheduler.requestIdleCallback) {
      idleHandle = scheduler.requestIdleCallback(runLoad, {
        timeout: DEFAULT_IDLE_TIMEOUT_MS
      })
      return
    }

    fallbackHandle = scheduler.setTimeout(
      runLoad,
      DEFAULT_IDLE_TIMEOUT_MS
    )
  }

  if (scheduler.observeLargestContentfulPaint) {
    disconnectLcp = scheduler.observeLargestContentfulPaint(
      () => {
        if (fallbackHandle !== undefined) {
          scheduler.clearTimeout(fallbackHandle)
          fallbackHandle = undefined
        }
        scheduleIdle()
      }
    )

    fallbackHandle = scheduler.setTimeout(
      scheduleIdle,
      DEFAULT_LCP_FALLBACK_MS
    )
  } else {
    scheduleIdle()
  }

  const handleInteraction = () => {
    runLoad()
  }

  if (eventTarget) {
    eventTarget.addEventListener(
      CONSENT_OPEN_EVENT,
      handleInteraction
    )
    for (const eventName of INTERACTION_EVENTS) {
      eventTarget.addEventListener(eventName, handleInteraction, {
        once: true,
        passive: true
      } as AddEventListenerOptions)
    }
  }

  return () => {
    cancelled = true
    disconnectLcp?.()
    if (
      idleHandle !== undefined &&
      scheduler.cancelIdleCallback
    ) {
      scheduler.cancelIdleCallback(idleHandle)
    }
    if (fallbackHandle !== undefined) {
      scheduler.clearTimeout(fallbackHandle)
    }
    if (eventTarget) {
      eventTarget.removeEventListener(
        CONSENT_OPEN_EVENT,
        handleInteraction
      )
      for (const eventName of INTERACTION_EVENTS) {
        eventTarget.removeEventListener(
          eventName,
          handleInteraction
        )
      }
    }
  }
}
