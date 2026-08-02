import { z } from 'zod'

export const pageViewDispatchObservationSchema = z.strictObject({
  correlation_token: z
    .string()
    .regex(/^\d{10}\.[A-Za-z0-9_-]{43}$/u),
  edge_request_id: z.string().uuid(),
  event_id: z.string().uuid(),
  event_name: z.literal('page_view'),
  page_view_id: z.string().uuid()
})

export type PageViewDispatchObservation = z.infer<
  typeof pageViewDispatchObservationSchema
>

type PageViewDispatchObservationTransportOptions = {
  maxAttempts?: number
  waitBeforeRetry?: (attempt: number) => Promise<void>
}

function wait(milliseconds: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

export function createPageViewDispatchObservationTransport(
  send: (
    observation: PageViewDispatchObservation
  ) => Promise<void>,
  options: PageViewDispatchObservationTransportOptions = {}
) {
  const completedEventIds = new Set<string>()
  const inFlightEventIds = new Set<string>()
  const maxAttempts = options.maxAttempts ?? 3
  const waitBeforeRetry =
    options.waitBeforeRetry ??
    (attempt => wait(attempt === 1 ? 150 : 500))

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('maxAttempts must be a positive integer')
  }

  return {
    observe: async (input: PageViewDispatchObservation) => {
      const observation =
        pageViewDispatchObservationSchema.parse(input)

      if (
        completedEventIds.has(observation.event_id) ||
        inFlightEventIds.has(observation.event_id)
      ) {
        return 'skipped' as const
      }

      inFlightEventIds.add(observation.event_id)

      try {
        for (
          let attempt = 1;
          attempt <= maxAttempts;
          attempt += 1
        ) {
          try {
            await send(observation)
            completedEventIds.add(observation.event_id)
            return 'sent' as const
          } catch {
            if (attempt === maxAttempts) return 'failed' as const
            await waitBeforeRetry(attempt)
          }
        }

        return 'failed' as const
      } finally {
        inFlightEventIds.delete(observation.event_id)
      }
    }
  }
}

export const browserPageViewDispatchObservationTransport =
  createPageViewDispatchObservationTransport(
    async observation => {
      const response = await fetch(
        '/api/observability/page-view-dispatch',
        {
          body: JSON.stringify(observation),
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          method: 'POST'
        }
      )

      if (!response.ok) {
        throw new Error(
          `Page-view dispatch observation returned ${response.status}`
        )
      }
    }
  )
