import { z } from 'zod'
import { canonicalEventEnvelopeSchema } from './canonicalEventEnvelope'
import {
  metaAppEventSchema,
  metaOfflineEventSchema
} from './metaNonWebEventContract'

const consentValueSchema = z.enum(['denied', 'granted'])

const metaAppConsentSchema = z.strictObject({
  analytics: consentValueSchema,
  marketing: z.literal('granted'),
  preferences: consentValueSchema,
  source: z.literal('app'),
  version: z.string().trim().min(1).max(100)
})

const metaOfflineConsentSchema = metaAppConsentSchema.extend({
  source: z.literal('offline')
})

const canonicalMetaAppEventBaseSchema =
  canonicalEventEnvelopeSchema
    .omit({ consent: true })
    .extend({
      consent: metaAppConsentSchema,
      event_name: z.literal('meta_app_event'),
      meta_event: metaAppEventSchema,
      source: z.literal('server')
    })

export const canonicalMetaAppEventSchema =
  canonicalMetaAppEventBaseSchema.superRefine(
    (event, context) => {
      if (event.consent.source !== 'app') {
        context.addIssue({
          code: 'custom',
          message: 'App events require an app consent source',
          path: ['consent', 'source']
        })
      }
      if (event.consent.marketing !== 'granted') {
        context.addIssue({
          code: 'custom',
          message: 'Meta app events require marketing consent',
          path: ['consent', 'marketing']
        })
      }
    }
  )

const canonicalMetaOfflineEventBaseSchema =
  canonicalEventEnvelopeSchema
    .omit({ consent: true })
    .extend({
      consent: metaOfflineConsentSchema,
      event_name: z.literal('meta_offline_event'),
      meta_event: metaOfflineEventSchema,
      source: z.literal('server')
    })

export const canonicalMetaOfflineEventSchema =
  canonicalMetaOfflineEventBaseSchema.superRefine(
    (event, context) => {
      if (event.consent.source !== 'offline') {
        context.addIssue({
          code: 'custom',
          message:
            'Offline events require an offline consent source',
          path: ['consent', 'source']
        })
      }
      if (event.consent.marketing !== 'granted') {
        context.addIssue({
          code: 'custom',
          message:
            'Meta offline events require marketing consent',
          path: ['consent', 'marketing']
        })
      }
    }
  )

export type CanonicalMetaAppEvent = z.infer<
  typeof canonicalMetaAppEventSchema
>
export type CanonicalMetaOfflineEvent = z.infer<
  typeof canonicalMetaOfflineEventSchema
>
