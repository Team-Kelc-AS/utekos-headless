import { z } from 'zod'
import {
  metaAppEventSchema,
  metaOfflineEventSchema
} from './metaNonWebEventContract'

const consentValueSchema = z.enum(['denied', 'granted'])

const metaNonWebConsentBaseShape = {
  analytics: consentValueSchema,
  marketing: z.literal('granted'),
  preferences: consentValueSchema,
  version: z.string().trim().min(1).max(100)
} as const

const metaAppEventIngestSchema = z.strictObject({
  consent: z.strictObject({
    ...metaNonWebConsentBaseShape,
    source: z.literal('app')
  }),
  event: metaAppEventSchema,
  schema_version: z.literal(1),
  source_type: z.literal('app')
})

const metaOfflineEventIngestSchema = z.strictObject({
  consent: z.strictObject({
    ...metaNonWebConsentBaseShape,
    source: z.literal('offline')
  }),
  event: metaOfflineEventSchema,
  schema_version: z.literal(1),
  source_type: z.literal('offline')
})

export const metaNonWebEventIngestSchema = z.discriminatedUnion(
  'source_type',
  [metaAppEventIngestSchema, metaOfflineEventIngestSchema]
)

export type MetaNonWebEventIngest = z.infer<
  typeof metaNonWebEventIngestSchema
>
