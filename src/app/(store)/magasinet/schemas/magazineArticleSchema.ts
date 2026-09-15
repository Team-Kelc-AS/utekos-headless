import type { StaticImageData } from 'next/image'
import { z } from 'zod'

export const magazineCategorySchema = z.enum([
  'Tips og råd',
  'Om Utekos',
  'Hytteliv',
  'Terrasseliv',
  'Bobilliv',
  'Båtliv'
])

export const magazineThemeSchema = z
  .object({
    accent: z.enum(['ancient-water', 'bleached-mauve', 'very-peri', 'mountain-view', 'overcast', 'primary']),
    surface: z.enum(['light', 'dark']).default('light')
  })
  .strict()

const staticImageDataSchema = z.custom<StaticImageData>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    'src' in value &&
    typeof (value as StaticImageData).src === 'string'
)

export const magazineImageSchema = z
  .object({
    src: z.union([z.string().min(1), staticImageDataSchema]),
    alt: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    caption: z.string().optional()
  })
  .strict()

const magazineLinkSchema = z
  .object({
    href: z.string().min(1),
    label: z.string().min(1),
    trackingId: z.string().optional()
  })
  .strict()

const magazineLeadBlockSchema = z
  .object({
    type: z.literal('lead'),
    text: z.string().min(1)
  })
  .strict()

const magazineParagraphBlockSchema = z
  .object({
    type: z.literal('paragraph'),
    text: z.string().min(1)
  })
  .strict()

const magazineHeadingBlockSchema = z
  .object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1),
    eyebrow: z.string().optional()
  })
  .strict()

const magazineImageBlockSchema = magazineImageSchema
  .extend({
    type: z.literal('image'),
    priority: z.boolean().optional()
  })
  .strict()

const magazineCalloutBlockSchema = z
  .object({
    type: z.literal('callout'),
    title: z.string().optional(),
    text: z.string().min(1),
    tone: z.enum(['quiet', 'dark', 'accent', 'commerce']).default('quiet')
  })
  .strict()

const magazineCtaBlockSchema = z
  .object({
    type: z.literal('cta'),
    title: z.string().min(1),
    text: z.string().min(1),
    primary: magazineLinkSchema,
    secondary: magazineLinkSchema.optional()
  })
  .strict()

const magazineFeatureGridBlockSchema = z
  .object({
    type: z.literal('featureGrid'),
    title: z.string().optional(),
    intro: z.string().optional(),
    items: z
      .array(
        z
          .object({
            title: z.string().min(1),
            text: z.string().min(1),
            icon: z
              .enum([
                'anchor',
                'badgeCheck',
                'bus',
                'check',
                'coffee',
                'compass',
                'feather',
                'flame',
                'heart',
                'home',
                'layers',
                'leaf',
                'lightbulb',
                'map',
                'mountain',
                'package',
                'shield',
                'sparkles',
                'sun',
                'thermometer',
                'waves'
              ])
              .optional()
          })
          .strict()
      )
      .min(1)
  })
  .strict()

const magazineStepListBlockSchema = z
  .object({
    type: z.literal('stepList'),
    title: z.string().optional(),
    intro: z.string().optional(),
    steps: z
      .array(
        z
          .object({
            title: z.string().min(1),
            text: z.string().min(1)
          })
          .strict()
      )
      .min(1)
  })
  .strict()

const magazineComparisonBlockSchema = z
  .object({
    type: z.literal('comparison'),
    title: z.string().min(1),
    columns: z
      .array(
        z
          .object({
            title: z.string().min(1),
            text: z.string().optional(),
            items: z.array(z.string().min(1)).min(1)
          })
          .strict()
      )
      .min(2)
  })
  .strict()

const magazineFaqBlockSchema = z
  .object({
    type: z.literal('faq'),
    title: z.string().optional(),
    items: z
      .array(
        z
          .object({
            question: z.string().min(1),
            answer: z.string().min(1)
          })
          .strict()
      )
      .min(1)
  })
  .strict()

const magazineCustomSectionBlockSchema = z
  .object({
    type: z.literal('customSection'),
    id: z.string().min(1),
    title: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional()
  })
  .strict()

export const magazineBlockSchema = z.discriminatedUnion('type', [
  magazineLeadBlockSchema,
  magazineParagraphBlockSchema,
  magazineHeadingBlockSchema,
  magazineImageBlockSchema,
  magazineCalloutBlockSchema,
  magazineCtaBlockSchema,
  magazineFeatureGridBlockSchema,
  magazineStepListBlockSchema,
  magazineComparisonBlockSchema,
  magazineFaqBlockSchema,
  magazineCustomSectionBlockSchema
])

export const magazineArticleSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    excerpt: z.string().min(1),
    category: magazineCategorySchema,
    publishedAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    readingTimeMinutes: z.number().int().positive().optional(),
    author: z
      .object({
        name: z.string().min(1)
      })
      .strict()
      .optional(),
    heroImage: magazineImageSchema,
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional()
      })
      .strict()
      .optional(),
    theme: magazineThemeSchema,
    blocks: z.array(magazineBlockSchema).min(1),
    relatedSlugs: z.array(z.string().min(1)).optional()
  })
  .strict()

export const magazineArticleCollectionSchema = z.array(magazineArticleSchema)
