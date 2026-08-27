import { z } from 'zod'

import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'

const PRODUCT_IMAGE_ORIGIN = 'https://utekos.no'
const PRODUCT_IMAGE_PATH_PREFIX = '/gtin/product-images/'

export const productStructuredImageAspectRatioSchema = z.enum([
  '1:1',
  '4:3',
  '16:9'
])

export const productStructuredImageRoleSchema = z.enum([
  'primary',
  'alternate',
  'detail'
])

const productStructuredImageSchema = z.strictObject({
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: productStructuredImageAspectRatioSchema,
  role: productStructuredImageRoleSchema,
  caption: z.string().min(20)
})

const productStructuredImageManifestEntrySchema = z.strictObject({
  productKey: z.enum([
    'utekos-techdown',
    'utekos-mikrofiber',
    'utekos-dun',
    'utekos-stapper',
    'comfyrobe'
  ]),
  structuredDataEligible: z.boolean(),
  images: z.array(productStructuredImageSchema).min(1)
})

const productStructuredImageManifestSchema = z
  .record(
    z.string().regex(/^\d{14}$/),
    productStructuredImageManifestEntrySchema
  )
  .superRefine((manifest, context) => {
    for (const [gtin, entry] of Object.entries(manifest)) {
      if (!isValidGtin(gtin)) {
        context.addIssue({
          code: 'custom',
          path: [gtin],
          message: 'Manifest key must be a checksum-valid GTIN'
        })
      }

      const aspectRatios = new Set<string>()
      let primaryImageCount = 0

      for (const [imageIndex, image] of entry.images.entries()) {
        const imageUrl = new URL(image.url)
        const expectedFileName =
          image.aspectRatio === '1:1' ? `${gtin}.png`
          : image.aspectRatio === '4:3' ? `${gtin}-4x3.webp`
          : `${gtin}-16x9.webp`

        if (
          imageUrl.origin !== PRODUCT_IMAGE_ORIGIN ||
          imageUrl.pathname !==
            `${PRODUCT_IMAGE_PATH_PREFIX}${expectedFileName}`
        ) {
          context.addIssue({
            code: 'custom',
            path: [gtin, 'images', imageIndex, 'url'],
            message:
              'Image URL must use the canonical public GTIN filename'
          })
        }

        const hasExpectedAspectRatio =
          image.aspectRatio === '1:1' ?
            image.width === image.height
          : image.aspectRatio === '4:3' ?
            image.width * 3 === image.height * 4
          : image.width * 9 === image.height * 16

        if (!hasExpectedAspectRatio) {
          context.addIssue({
            code: 'custom',
            path: [gtin, 'images', imageIndex, 'aspectRatio'],
            message: 'Declared dimensions do not match the aspect ratio'
          })
        }

        if (image.width * image.height < 50_000) {
          context.addIssue({
            code: 'custom',
            path: [gtin, 'images', imageIndex],
            message: 'Image must contain at least 50,000 pixels'
          })
        }

        if (aspectRatios.has(image.aspectRatio)) {
          context.addIssue({
            code: 'custom',
            path: [gtin, 'images', imageIndex, 'aspectRatio'],
            message: 'Each GTIN can have only one image per aspect ratio'
          })
        }

        aspectRatios.add(image.aspectRatio)

        if (image.role === 'primary') {
          primaryImageCount += 1
        }
      }

      if (primaryImageCount !== 1) {
        context.addIssue({
          code: 'custom',
          path: [gtin, 'images'],
          message: 'Each GTIN must have exactly one primary image'
        })
      }
    }
  })

const squareImage = (
  gtin: string,
  caption: string,
  dimensions = 2400
) => ({
  url: `${PRODUCT_IMAGE_ORIGIN}${PRODUCT_IMAGE_PATH_PREFIX}${gtin}.png`,
  width: dimensions,
  height: dimensions,
  aspectRatio: '1:1' as const,
  role: 'primary' as const,
  caption
})

export const productStructuredImageManifest =
  productStructuredImageManifestSchema.parse({
    '07090062980009': {
      productKey: 'utekos-techdown',
      structuredDataEligible: false,
      images: [
        squareImage(
          '07090062980009',
          'Produktbilde av Utekos TechDown™ i Havdyp, størrelse Liten.'
        )
      ]
    },
    '07090062980016': {
      productKey: 'utekos-techdown',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980016',
          'Produktbilde av Utekos TechDown™ i Havdyp, størrelse Middels.'
        )
      ]
    },
    '07090062980023': {
      productKey: 'utekos-techdown',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980023',
          'Produktbilde av Utekos TechDown™ i Havdyp, størrelse Stor.'
        )
      ]
    },
    '07090062980030': {
      productKey: 'utekos-techdown',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980030',
          'Produktbilde av Utekos TechDown™ i Havdyp, størrelse Større.'
        )
      ]
    },
    '07090062980047': {
      productKey: 'utekos-mikrofiber',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980047',
          'Produktbilde av Utekos Mikrofiber™ i Fjellblå, størrelse Medium.'
        )
      ]
    },
    '07090062980054': {
      productKey: 'utekos-mikrofiber',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980054',
          'Produktbilde av Utekos Mikrofiber™ i Fjellblå, størrelse Large.'
        )
      ]
    },
    '07090062980061': {
      productKey: 'utekos-mikrofiber',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980061',
          'Produktbilde av Utekos Mikrofiber™ i Vargnatt, størrelse Medium.'
        )
      ]
    },
    '07090062980078': {
      productKey: 'utekos-mikrofiber',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980078',
          'Produktbilde av Utekos Mikrofiber™ i Vargnatt, størrelse Large.'
        )
      ]
    },
    '07090062980085': {
      productKey: 'comfyrobe',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980085',
          'Produktbilde av Comfyrobe™ i Fjellnatt, størrelse XS.'
        )
      ]
    },
    '07090062980092': {
      productKey: 'comfyrobe',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980092',
          'Produktbilde av Comfyrobe™ i Fjellnatt, størrelse XL.',
          1080
        )
      ]
    },
    '07090062980108': {
      productKey: 'utekos-stapper',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980108',
          'Produktbilde av Utekos Stapper™ i Vargnatt, størrelse OneSize.'
        )
      ]
    },
    '07090062980115': {
      productKey: 'utekos-dun',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980115',
          'Produktbilde av Utekos Dun™ i Fjellblå, størrelse Medium.'
        )
      ]
    },
    '07090062980122': {
      productKey: 'utekos-dun',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980122',
          'Produktbilde av Utekos Dun™ i Fjellblå, størrelse Large.'
        )
      ]
    },
    '07090062980139': {
      productKey: 'utekos-dun',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980139',
          'Produktbilde av Utekos Dun™ i Vargnatt, størrelse Medium.'
        )
      ]
    },
    '07090062980146': {
      productKey: 'utekos-dun',
      structuredDataEligible: true,
      images: [
        squareImage(
          '07090062980146',
          'Produktbilde av Utekos Dun™ i Vargnatt, størrelse Large.'
        )
      ]
    }
  })

export type ProductStructuredImage = z.infer<
  typeof productStructuredImageSchema
>

export function getStructuredDataEligibleGtins() {
  return Object.entries(productStructuredImageManifest)
    .filter(([, entry]) => entry.structuredDataEligible)
    .map(([gtin]) => gtin)
    .sort((left, right) => left.localeCompare(right))
}

export function resolveProductStructuredImages(input: {
  gtin: string | null | undefined
  productKey: string
}): readonly ProductStructuredImage[] {
  const normalizedGtin = normalizeGtin(input.gtin)

  if (!normalizedGtin || !isValidGtin(normalizedGtin)) {
    return []
  }

  const manifestEntry =
    productStructuredImageManifest[normalizedGtin]

  if (
    !manifestEntry ||
    !manifestEntry.structuredDataEligible ||
    manifestEntry.productKey !== input.productKey
  ) {
    return []
  }

  return manifestEntry.images
}
