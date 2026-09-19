import * as z from '@/lib/validation/zodMini'
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

const safePath = z.string().check(
  z.minLength(1),
  z.maxLength(256),
  z.refine(
    value =>
      value.startsWith('/') &&
      sanitizeJourneyPath(value) === value,
    'Expected a sanitized public pathname without query or identifiers'
  )
)
const utmValue = z.string().check(
  z.trim(),
  z.minLength(1),
  z.maxLength(128),
  z.regex(/^[\p{L}\p{N} _().-]+$/u),
  z.refine(
    value => !/\d{7,}/.test(value),
    'Identifiers are not campaign labels'
  )
)

export const journeyUtmSchema = z
  .strictObject({
    utm_source: z.optional(utmValue),
    utm_medium: z.optional(utmValue),
    utm_campaign: z.optional(utmValue),
    utm_content: z.optional(utmValue),
    utm_term: z.optional(utmValue)
  })
  .check(
    z.refine(
      value => Object.keys(value).length > 0,
      'At least one validated UTM is required'
    )
  )

const envelope = z.strictObject({
  schema_version: z.literal(1),
  event_id: z.string().check(z.uuid()),
  journey_id: z.string().check(z.uuid()),
  page_view_id: z.string().check(z.uuid()),
  previous_page_view_id: z.optional(z.string().check(z.uuid())),
  occurred_at: z
    .string()
    .check(z.iso.datetime({ offset: true })),
  page_path: safePath,
  consent: z.extend(consentSnapshotSchema, {
    analytics: z.literal('granted'),
    version: z.string().check(z.minLength(1), z.maxLength(64))
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
    z.extend(envelope, {
      event_name: z.literal('utm_landing_page_view'),
      page_path: z.literal('/skreddersy-varmen'),
      data: journeyUtmSchema
    }),
    z.extend(envelope, {
      event_name: z.literal('page_arrival'),
      data: z.strictObject({
        navigation_type: z.enum([
          'initial',
          'internal',
          'back_forward'
        ])
      })
    }),
    z.extend(envelope, {
      event_name: z.literal('section_view'),
      data: z.strictObject({
        section_id: journeySectionSchema,
        dwell_ms: z
          .number()
          .check(z.int(), z.gte(1000), z.lte(86400000))
      })
    }),
    z.extend(envelope, {
      event_name: z.literal('internal_link_click'),
      data: z.strictObject({
        link_id: z
          .string()
          .check(
            z.minLength(1),
            z.maxLength(128),
            z.regex(/^[a-zA-Z0-9_:.\/-]+$/)
          ),
        source_section: z.optional(journeySectionSchema),
        target_path: safePath,
        navigation_type: z.enum([
          'same_page',
          'same_tab',
          'new_tab'
        ])
      })
    }),
    z.extend(envelope, {
      event_name: z.literal('journey_progress'),
      data: z.strictObject({
        max_scroll_y: z
          .number()
          .check(z.int(), z.gte(0), z.lte(10000000)),
        max_scroll_percent: z
          .number()
          .check(z.gte(0), z.lte(100)),
        document_height: z
          .number()
          .check(z.int(), z.gt(0), z.lte(10000000)),
        viewport_height: z
          .number()
          .check(z.int(), z.gt(0), z.lte(100000)),
        last_visible_section: z.optional(journeySectionSchema),
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
