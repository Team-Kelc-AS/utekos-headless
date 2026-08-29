import { z } from 'zod'

export const PINTEREST_MAX_IMAGE_URL_LENGTH = 2000
export const PINTEREST_MAX_ADDITIONAL_IMAGES = 10

const pinterestCatalogImageUrlSchema = z
  .url()
  .max(PINTEREST_MAX_IMAGE_URL_LENGTH)
  .refine(value => {
    const url = new URL(value)

    return (
      url.protocol === 'https:' &&
      url.search === '' &&
      url.hash === ''
    )
  }, 'Pinterest catalog image URLs must be https without query or hash')

export const pinterestCatalogImageSetSchema = z
  .strictObject({
    imageLink: pinterestCatalogImageUrlSchema,
    additionalImageLinks: z
      .array(pinterestCatalogImageUrlSchema)
      .max(PINTEREST_MAX_ADDITIONAL_IMAGES)
  })
  .superRefine((imageSet, context) => {
    const seen = new Set([imageSet.imageLink])

    for (const [
      index,
      imageLink
    ] of imageSet.additionalImageLinks.entries()) {
      if (seen.has(imageLink)) {
        context.addIssue({
          code: 'custom',
          path: ['additionalImageLinks', index],
          message:
            'Pinterest catalog additional images must be unique'
        })
      }

      seen.add(imageLink)
    }
  })
