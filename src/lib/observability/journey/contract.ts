import { z } from 'zod'
import { consentSnapshotSchema } from '@/lib/analytics/canonicalEventEnvelope'
import { sanitizeJourneyPath } from './sanitizeJourneyPath'

export { sanitizeJourneyPath } from './sanitizeJourneyPath'

export const journeySectionSchema = z.enum([
  'hero',
  'empathy',
  'purchase',
  'purchase_button',
  'three_in_one',
  'techdown',
  'reviews',
  'faq',
  'bottom_navigation'
])

export type JourneySection = z.infer<typeof journeySectionSchema>

const safePath = z
  .string()
  .min(1)
  .max(256)
  .refine(
    value =>
      value.startsWith('/') &&
      sanitizeJourneyPath(value) === value,
    'Expected a sanitized public pathname without query or identifiers'
  )
const utmValue = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[\p{L}\p{N} _().-]+$/u)
  .refine(
    value => !/\d{7,}/.test(value),
    'Identifiers are not campaign labels'
  )

export const journeyUtmSchema = z
  .strictObject({
    utm_source: utmValue.optional(),
    utm_medium: utmValue.optional(),
    utm_campaign: utmValue.optional(),
    utm_content: utmValue.optional(),
    utm_term: utmValue.optional()
  })
  .refine(
    value => Object.keys(value).length > 0,
    'At least one validated UTM is required'
  )

const envelope = z.strictObject({
  schema_version: z.literal(1),
  event_id: z.string().uuid(),
  journey_id: z.string().uuid(),
  page_view_id: z.string().uuid(),
  previous_page_view_id: z.string().uuid().optional(),
  occurred_at: z.string().datetime({ offset: true }),
  page_path: safePath,
  consent: consentSnapshotSchema.extend({
    analytics: z.literal('granted'),
    version: z.string().min(1).max(64)
  }),
  source: z.literal('browser'),
  environment: z.enum([
    'development',
    'preview',
    'production',
    'test'
  ])
})

export const journeyEventSchema = z.discriminatedUnion(
  'event_name',
  [
    envelope.extend({
      event_name: z.literal('utm_landing_page_view'),
      page_path: z.literal('/skreddersy-varmen'),
      data: journeyUtmSchema
    }),
    envelope.extend({
      event_name: z.literal('page_arrival'),
      data: z.strictObject({
        navigation_type: z.enum([
          'initial',
          'internal',
          'back_forward'
        ])
      })
    }),
    envelope.extend({
      event_name: z.literal('section_view'),
      data: z.strictObject({
        section_id: journeySectionSchema,
        dwell_ms: z.number().int().min(1000).max(86_400_000)
      })
    }),
    envelope.extend({
      event_name: z.literal('internal_link_click'),
      data: z.strictObject({
        link_id: z
          .string()
          .min(1)
          .max(128)
          .regex(/^[a-zA-Z0-9_:.\/-]+$/),
        source_section: journeySectionSchema.optional(),
        target_path: safePath,
        navigation_type: z.enum([
          'same_page',
          'same_tab',
          'new_tab'
        ])
      })
    }),
    envelope.extend({
      event_name: z.literal('journey_progress'),
      data: z.strictObject({
        max_scroll_y: z.number().int().min(0).max(10_000_000),
        max_scroll_percent: z.number().min(0).max(100),
        document_height: z
          .number()
          .int()
          .positive()
          .max(10_000_000),
        viewport_height: z
          .number()
          .int()
          .positive()
          .max(100_000),
        last_visible_section: journeySectionSchema.optional(),
        reason: z.enum([
          'interval',
          'hidden',
          'navigation',
          'pagehide'
        ])
      })
    })
  ]
)

export type JourneyEvent = z.infer<typeof journeyEventSchema>
