import type { JourneyEvent } from './contract'

export function createJourneyTransport(dependencies: {
  fetch: typeof fetch
  allowed: () => boolean
  schedule?: (
    callback: () => void,
    delay: number
  ) => ReturnType<typeof setTimeout>
  cancel?: (timer: ReturnType<typeof setTimeout>) => void
}) {
  const pending = new Map<
    string,
    {
      event: JourneyEvent
      attempts: number
      controller?: AbortController
      timer?: ReturnType<typeof setTimeout>
    }
  >()
  const schedule =
    dependencies.schedule ??
    ((callback: () => void, delay: number) =>
      setTimeout(callback, delay))
  const cancel = dependencies.cancel ?? clearTimeout

  async function deliver(id: string) {
    const entry = pending.get(id)
    if (!entry || !dependencies.allowed()) return
    entry.attempts += 1
    const controller = new AbortController()
    entry.controller = controller
    const timeout = setTimeout(() => controller.abort(), 5000)
    let retry = true
    try {
      const response = await dependencies.fetch(
        '/api/observability/journey',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          keepalive: true,
          signal: controller.signal,
          body: JSON.stringify(entry.event)
        }
      )
      retry = response.status === 429 || response.status >= 500
    } catch {
      /* Reuse the event ID when acknowledgement is lost. */
    } finally {
      clearTimeout(timeout)
    }
    if (pending.get(id) !== entry) return
    if (retry && entry.attempts < 3 && dependencies.allowed()) {
      entry.timer = schedule(() => {
        void deliver(id)
      }, entry.attempts * 1000)
    } else {
      pending.delete(id)
    }
  }

  function send(event: JourneyEvent) {
    if (
      !dependencies.allowed() ||
      pending.has(event.event_id) ||
      pending.size >= 64
    )
      return
    pending.set(event.event_id, { event, attempts: 0 })
    void deliver(event.event_id)
  }

  function revoke() {
    for (const entry of pending.values()) {
      if (entry.timer) cancel(entry.timer)
      entry.controller?.abort()
    }
    pending.clear()
  }
  return { send, revoke }
}
