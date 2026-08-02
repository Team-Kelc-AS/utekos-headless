import { z } from 'zod'
import type { ConsentSnapshot } from './pageViewEvent'

const consentValueSchema = z.enum(['denied', 'granted'])

export const landingConsentObservationSchema = z.strictObject({
  correlation_token: z
    .string()
    .regex(/^\d{10}\.[A-Za-z0-9_-]{43}$/u),
  edge_request_id: z.string().uuid(),
  page_view_id: z.string().uuid(),
  consent: z.strictObject({
    analytics: consentValueSchema,
    marketing: consentValueSchema,
    preferences: consentValueSchema,
    source: z.literal('cookiebot'),
    version: z.string().min(1)
  })
})

export type LandingConsentObservation = z.infer<
  typeof landingConsentObservationSchema
>

export type LandingConsentDecision =
  | 'denied'
  | 'granted'
  | 'partial'

export function classifyLandingConsentDecision(
  consent: ConsentSnapshot
): LandingConsentDecision {
  const values = [
    consent.analytics,
    consent.marketing,
    consent.preferences
  ]

  if (values.every(value => value === 'granted'))
    return 'granted'
  if (values.every(value => value === 'denied')) return 'denied'
  return 'partial'
}

export function createLandingConsentTransport(
  send: (
    observation: LandingConsentObservation
  ) => Promise<void>,
  options: {
    maximumAttempts?: number
    waitBeforeRetry?: (
      completedAttempts: number
    ) => Promise<void>
  } = {}
) {
  const maximumAttempts = options.maximumAttempts ?? 3
  if (
    !Number.isInteger(maximumAttempts) ||
    maximumAttempts < 1
  ) {
    throw new Error('maximumAttempts must be a positive integer')
  }

  const waitBeforeRetry =
    options.waitBeforeRetry ??
    (completedAttempts =>
      new Promise(resolve => {
        const delayMilliseconds =
          completedAttempts === 1 ? 250 : 1_000
        setTimeout(resolve, delayMilliseconds)
      }))
  const completedStates = new Set<string>()
  const pendingStates = new Set<string>()
  const attemptsByState = new Map<string, number>()
  const correlationQueues = new Map<string, Promise<void>>()

  return {
    observe: async (input: LandingConsentObservation) => {
      const observation =
        landingConsentObservationSchema.parse(input)
      const stateKey = [
        observation.edge_request_id,
        observation.page_view_id,
        observation.consent.analytics,
        observation.consent.marketing,
        observation.consent.preferences
      ].join(':')
      const correlationKey = [
        observation.edge_request_id,
        observation.page_view_id
      ].join(':')

      if (
        completedStates.has(stateKey) ||
        pendingStates.has(stateKey)
      ) {
        return 'skipped' as const
      }

      pendingStates.add(stateKey)
      const predecessor =
        correlationQueues.get(correlationKey) ??
        Promise.resolve()
      const sendTask = predecessor.then(async () => {
        while (
          (attemptsByState.get(stateKey) ?? 0) < maximumAttempts
        ) {
          const attemptNumber =
            (attemptsByState.get(stateKey) ?? 0) + 1
          attemptsByState.set(stateKey, attemptNumber)

          try {
            await send(observation)
            completedStates.add(stateKey)
            return 'sent' as const
          } catch {
            if (attemptNumber >= maximumAttempts) break
            await waitBeforeRetry(attemptNumber)
          }
        }

        return 'failed' as const
      })
      const queueTail = sendTask.then(
        () => undefined,
        () => undefined
      )
      correlationQueues.set(correlationKey, queueTail)

      try {
        return await sendTask
      } finally {
        pendingStates.delete(stateKey)
        if (
          correlationQueues.get(correlationKey) === queueTail
        ) {
          correlationQueues.delete(correlationKey)
        }
      }
    }
  }
}

export const browserLandingConsentTransport =
  createLandingConsentTransport(async observation => {
    const response = await fetch(
      '/api/observability/landing-consent',
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
        `Landing consent collector returned ${response.status}`
      )
    }
  })
